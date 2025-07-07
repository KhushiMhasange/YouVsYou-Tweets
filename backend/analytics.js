function summarizeMetrics(tweets) {
  const sum = {
    likes: 0,
    replies: 0,
    retweets: 0,
    impressions: 0
  };

  tweets.forEach(t => {
    sum.likes += t.public_metrics.like_count;
    sum.replies += t.public_metrics.reply_count;
    sum.retweets += t.public_metrics.retweet_count;
    sum.impressions += t.public_metrics.impression_count;
  });

  const avg = {
    likes: sum.likes / tweets.length || 0,
    replies: sum.replies / tweets.length || 0,
    retweets: sum.retweets / tweets.length || 0,
    impressions: sum.impressions / tweets.length || 0,
  };

  return { total: sum, average: avg };
}

module.exports = {
  summarizeMetrics
};