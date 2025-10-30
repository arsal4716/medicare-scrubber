const axios = require("axios");
const { withTimeout } = require("./helpers");

const AGENT_CHECK_NUMBER = "3054950000";
const API_TIMEOUT = 8000;

let lastAgentCheck = { time: 0, available: null, source: null };

const checkAgentAvailability = async (phoneNumber = AGENT_CHECK_NUMBER) => {
  const now = Date.now();
  if (now - lastAgentCheck.time < 300000 && lastAgentCheck.source) {
    return lastAgentCheck;
  }

  try {
    const tldcrmUrl = `https://hcs.tldcrm.com/api/public/dialer/ready/${phoneNumber}?ava=1&que=1&qui=27053&adg=true`;
    const tldcrmRes = await withTimeout(axios.get(tldcrmUrl), API_TIMEOUT);
    if (tldcrmRes.data.ready === 1) {
      lastAgentCheck = { time: now, available: true, source: "tldcrm" };
      return lastAgentCheck;
    }
  } catch (err) {}

  try {
    const sriUrl = `https://lm360.tldcrm.com/api/public/dialer/ready/${phoneNumber}?ava=1&ing=SRI_&sta=true&adg=true`;
    const sriRes = await withTimeout(axios.get(sriUrl), API_TIMEOUT);
    if (sriRes.data.ready === 1) {
      lastAgentCheck = { time: now, available: true, source: "sri" };
      return lastAgentCheck;
    }
  } catch (err) {}

  lastAgentCheck = { time: now, available: false, source: null };
  return lastAgentCheck;
};

module.exports = { checkAgentAvailability, lastAgentCheck };
