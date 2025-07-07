import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Success() {
  interface TwitterUser {
    id: number;
    name: string;
    screen_name: string;
    profile_image_url: string;
  }

  interface UserMetrics {
    likes: number;
    replies: number;
    retweets: number;
    impressions: number;
  }

  const [user, setUser] = useState<TwitterUser | null>(null);
  const [thenData, setThenData] = useState<string>('');
  const [nowData, setNowData] = useState<string>('');
  const [advice, setAdvice] = useState<string>('');
  const [nowMetrics, setMetrics] = useState<UserMetrics | null>(null);
  const [topicThen, setTopicThen] = useState<string>('');
  const [topicNow, setTopicNow] = useState<string>('');
  const [personalityThen, setPersonalityThen] = useState<string[]>([]);
  const [personalityNow, setPersonalityNow] = useState<string[]>([]);
  const [gistNow, setGistNow] = useState<string>('');
  const [gistThen, setGistThen] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get<TwitterUser>('http://localhost:5000/me', {
        withCredentials: true,
      })
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error('Failed to fetch user', err);
        navigate('/');
      });
  }, [navigate]);

  const handleGenerateComparison = async () => {

    try {
      const res = await axios.get('http://localhost:5000/run-nlp-analysis', {
        withCredentials: true,
      });

      const keywords = res.data.keywords;
      const summary = keywords["summary"] || '';

      setThenData(keywords["Summary then"] || '');
      setNowData(keywords["Summary now"] || '');
      setAdvice(keywords["Advice"] || '');
      setMetrics(res.data.difference);
      setTopicThen(keywords["Topic then"] || '');
      setTopicNow(keywords["Topic now"] || '');
      setPersonalityThen(keywords["Personality then"] || '');
      setPersonalityNow(keywords["Personality now"] || '');
     
      
      console.log(summary);
      const thenGistMatch = summary.match(/THEN TWEETS:\s*([^\n]+)/i);
      const nowGistMatch = summary.match(/NOW TWEETS:\s*([^\n]+)/i);
      console.log(thenGistMatch,nowGistMatch);
      const thenGist = thenGistMatch ? thenGistMatch[1].trim() : '';
      const nowGist = nowGistMatch ? nowGistMatch[1].trim() : '';
      console.log(thenGist,nowGist);

      setGistNow(nowGist);
      setGistThen(thenGist);

    } catch (err) {
      console.error('Failed to fetch tweets', err);
    }
  };

  const renderMeter = (label: string, value: number, id: string) => {
    const radius = 45;
    const stroke = 8;
    let percent;
    if(value>0)
    percent = Math.min(Math.max(Math.abs(value), 0), 100);
    else
    percent =-1*(Math.min(Math.max(Math.abs(value), 0), 100));
    const dashArray = 2 * Math.PI * radius;
    const dashOffset = dashArray - (percent / 100) * dashArray;

    return (
      <div className="flex flex-col items-center gap-2">
        <svg width="100" height="100" className="transform">
          <defs>
            <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="9.4%" stopColor="#72a7e8" />
              <stop offset="43.9%" stopColor="#fd8152" />
              <stop offset="54.8%" stopColor="#fd8152" />
              <stop offset="86.3%" stopColor="#f9ca56" />
            </linearGradient>
          </defs>
           <g transform="rotate(-90 50 50)">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#ffffff30"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={`url(#gradient-${id})`}
            strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            fill="transparent"
            strokeLinecap="round"
          />
          </g>
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
          >
            {value.toFixed(0)}
          </text>
        </svg>
        <span className="text-white/70 text-sm">{label}</span>
      </div>
    );
  };

  if (!user) return <p className='mx-auto top-50'>Loading...</p>;

  return (
    <div className='my-16 md:my-24 mx-4 md:mx-24'>
      <div className="flex flex-col md:flex-row justify-around gap-8 items-center p-4">
        <div className='flex flex-row gap-4'>
          <img src={user.profile_image_url} alt="profile" className="rounded-full border-2 border-[#3e7dcb]" />
          <div className='text-left'>
            <h2 className="text-xl font-bold ">{user.name}</h2>
            <p>@{user.screen_name}</p>
          </div>
        </div>

        <button
          className="bg-white/10 backdrop-blur-md border border-white/40 p-2 px-4 mt-2 text-[#3e7dcb] rounded-xl shadow-2xl font-bold text-lg transition duration-200 hover:bg-white/20"
          onClick={handleGenerateComparison}
        >
          Generate Comparison
        </button>
      </div>

      {nowMetrics && (
        <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-center text-center my-8 md:mx-24">
          {renderMeter("Likes", nowMetrics.likes, "likes")}
          {renderMeter("Replies", nowMetrics.replies, "replies")}
          {renderMeter("Retweets", nowMetrics.retweets, "retweets")}
          {renderMeter("Impressions", nowMetrics.impressions, "impressions")}
        </div>
        <div className='white/50'>
          - Average difference in reach
        </div>
        </div>
      )}

      <div className='flex flex-col md:flex-row justify-center gap-4 mt-10 px-4'>
        <div className="w-full md:w-1/2 min-h-[250px] bg-white/10 backdrop-blur-md border border-white/30 p-6 text-[#3e7dcb] rounded-xl shadow-xl transition duration-200 hover:bg-white/20">
          <h3 className="text-xl font-bold mb-4">Then 🕰️</h3>
          <div className="flex flex-wrap gap-2 mb-4">
              {topicThen && (<span className="bg-white/20 text-[#3e7dcb]/90 border border-white/30 px-3 py-1 rounded-full text-sm font-medium hover:bg-white/30 transition"> 
              {topicThen}
              </span>)}
          </div>
          <p className="text-base text-white/80 text-justify mb-4">{thenData}</p>
          <div className="flex flex-wrap gap-2">
          <span className="bg-white/20 text-[#3e7dcb]/90  px-3 py-1 rounded-full border border-white/30 text-sm font-medium hover:bg-white/30 transition">TL;DR</span>
          </div>
          <p className="text-base text-white/80 whitespace-pre-line text-justify py-2">{gistThen}</p>
          <div className="flex flex-wrap gap-2 mt-2">
          <span className="bg-white/20 text-[#3e7dcb]/90 px-3 py-1 rounded-full border border-white/30 text-sm font-medium hover:bg-white/30 transition">Personality-traits</span>
          {personalityThen.map((trait, index) => (
            <span
              key={index}
              className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-sm font-medium border border-white/30 hover:bg-white/30 transition"
            >
              {trait}
            </span>
          ))}
        </div>
        </div>

        <div className="w-full md:w-1/2 min-h-[250px] bg-white/10 backdrop-blur-md border border-white/30 p-6 text-[#3e7dcb] rounded-xl shadow-xl transition duration-200 hover:bg-white/20">
          <h3 className="text-xl font-bold mb-4">Now ⚡</h3>
          <div className="flex flex-wrap gap-2 mb-4">
              {topicNow && (<span className="bg-white/20 text-[#3e7dcb]/90 border border-white/30 px-3 py-1 rounded-full text-sm font-medium hover:bg-white/30 transition">
              {topicNow}
              </span>)}
          </div>
          <p className="text-base text-white/80 text-justify mb-4">{nowData}</p>
          <div className="flex flex-wrap gap-2 mb-2">
          <span className="bg-white/20 text-[#3e7dcb]/90 px-3 py-1 rounded-full border border-white/30 text-sm font-medium hover:bg-white/30 transition">TL;DR</span>
          </div>
          <p className="text-base text-white/80 whitespace-pre-line text-justify">{gistNow}</p>
          <div className="flex flex-wrap gap-2 mt-6">
          <span className="bg-white/20 text-[#3e7dcb]/90 px-3 py-1 rounded-full border border-white/30 text-sm font-medium hover:bg-white/30 transition">Personality-traits</span>
          {personalityNow.map((trait, index) => (
            <span
              key={index}
              className="bg-white/20 text-white/90 px-3 py-1 rounded-full text-sm font-medium border border-white/30 hover:bg-white/30 transition"
            >
              {trait}
            </span>
          ))}
</div>

        </div>
      </div>

      {/* {gistNow && gistThen && (
        <div className="w-full bg-white/10 backdrop-blur-md border border-white/30 p-6 text-[#3e7dcb] rounded-xl shadow-xl font-sans mt-6 hover:bg-white/20">
          <h3 className="text-xl font-bold mb-2">Then vs Now 📌</h3>
          
          
        </div>
      )} */}

      {advice && (
        <div className="w-full bg-white/10 backdrop-blur-md border border-white/30 p-6 text-[#3e7dcb] rounded-xl shadow-xl font-sans mt-6 hover:bg-white/20">
          <h3 className="text-xl font-bold mb-2">Advice 💡</h3>
          <p className="text-base text-white/80 text-justify">{advice}</p>
        </div>
      )}
      <footer className='p-10'>Created with 🤍 by @KhushiMhasange</footer>
    </div>
  );
}

export default Success;




