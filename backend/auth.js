const express = require('express');
const OAuth = require('oauth').OAuth;
const { summarizeMetrics } = require('./analytics');
const router = express.Router();
const { spawn } = require('child_process');
const api_key = process.env.API_KEY;
const api_secret = process.env.API_SECRET_KEY;
const callbackURL = 'http://localhost:5000/auth/twitter/callback';
const nowDummyData = require('./now');
const thenDummyData = require('./then');


const oauth = new OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  api_key,
  api_secret,
  '1.0A',
  callbackURL,
  'HMAC-SHA1'
);


router.get('/auth/twitter', (req, res) => {
  oauth.getOAuthRequestToken((err, token, tokenSecret) => {
    if (err){ 
      console.error('OAuth Request Token Error:', err);
      return res.status(500).json({ error: 'OAuth Request Token failed' });
    }
    req.session.tokenSecret = tokenSecret;
    res.redirect(`https://api.twitter.com/oauth/authenticate?oauth_token=${token}`);
  });
});


router.get('/auth/twitter/callback', (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const tokenSecret = req.session.tokenSecret;

  if (!tokenSecret) {
    return res.status(400).json({ error: 'Missing tokenSecret' });
  }

  oauth.getOAuthAccessToken(
    oauth_token,
    tokenSecret,
    oauth_verifier,
    (err, accessToken, accessTokenSecret) => {
       if (err) return res.status(500).json({ error: 'Access token failed' });
      req.session.accessToken = accessToken;
      req.session.accessTokenSecret = accessTokenSecret;

      res.redirect(`http://localhost:5173/auth/success`);
    }
  );
});

router.get('/me', (req, res) => {
  const accessToken = req.session.accessToken;
  const accessTokenSecret = req.session.accessTokenSecret;


  if (!accessToken || !accessTokenSecret) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  oauth.get(
    'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
    accessToken,
    accessTokenSecret,
    (err, data) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch user data' });
      const response = JSON.parse(data);
      req.session.userId = response.id_str;
      res.json({
      id: response.id_str,
      name: response.name,
      screen_name: response.screen_name,
      profile_image_url: response.profile_image_url, 
      });
    }
  );
});


router.get('/run-nlp-analysis', (req, res) => { 
  const accessToken = req.session.accessToken;
  const accessTokenSecret = req.session.accessTokenSecret;
  const userId = req.session.userId;

  if (!accessToken || !accessTokenSecret || !userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=created_at,public_metrics`;

  oauth.get(
    url,
    accessToken,
    accessTokenSecret,
    (err, data) => {
      if (err) {
        console.error('Error fetching tweets:', err);
        return res.status(500).json({ error: 'Failed to fetch tweets' });
      }  
          const tweets = JSON.parse(data).data || [];

      const originalTweets = tweets.filter(tweet => {
        const isRetweet = tweet.text.startsWith('RT');
        const isReply = tweet.in_reply_to_user_id !== undefined;
        return !isRetweet && !isReply;
      });

      originalTweets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

       const midpoint = Math.floor(originalTweets.length / 2);
       const thenData = originalTweets.slice(0, midpoint);
       const nowData = originalTweets.slice(midpoint);

       const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""; 

      const then = summarizeMetrics(thenData); 
      const now = summarizeMetrics(nowData);   
    // const then = summarizeMetrics(thenDummyData); Dummy data for testing
    // const now = summarizeMetrics(nowDummyData);   

    const diff = {
        likes: ((now.total.likes - then.total.likes) / (then.total.likes || 1)) * 100,
        replies: ((now.total.replies - then.total.replies) / (then.total.replies || 1)) * 100,
        retweets: ((now.total.retweets - then.total.retweets) / (then.total.retweets || 1)) * 100,
        impressions: ((now.total.impressions - then.total.impressions) / (then.total.impressions || 1)) * 100,
    };

    console.log(diff);

    const thenTexts = thenDummyData.map(t => t.text);
    const nowTexts = nowDummyData.map(t => t.text);

    const py = spawn('python3', ['analyse.py']);
    let result = '';
    let pythonErrors = '';

    py.stdout.on('data', chunk => {
        result += chunk.toString();
    });

    py.stderr.on('data', err => {
        pythonErrors += err.toString();
        console.error('Python Error (stderr):', err.toString());
    });

    py.on('close', code => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}. Errors: ${pythonErrors}`);
            return res.status(500).json({ error: `NLP analysis failed. Python script exited with code ${code}. Details: ${pythonErrors}` });
        }

        try {
            const analysis = JSON.parse(result);
            res.json({
                difference: diff,
                keywords: analysis, 
            });
            // console.log({keywords:analysis});
        } catch (parseError) {
            console.error('Error parsing Python script output:', parseError);
            console.error('Raw Python output:', result);
            return res.status(500).json({ error: `Failed to parse NLP analysis output. Raw output: ${result.substring(0, 200)}...`, parseError: parseError.message });
        }
    });
    const pythonPayload = {
        then: thenTexts,
        now: nowTexts,
        gemini_api_key: GEMINI_API_KEY 
    };

    py.stdin.write(JSON.stringify(pythonPayload));
    py.stdin.end();
  })
});


module.exports = router;
