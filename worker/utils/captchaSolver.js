const axios = require("axios");

const SUBMIT_URL = "https://2captcha.com/in.php";
const RESULT_URL = "https://2captcha.com/res.php";

/**
 * Submit captcha to 2Captcha and return the solved token.
 * @param {{ apiKey: string; siteKey: string; url: string; pollingIntervalMs?: number; timeoutMs?: number; userAgent?: string; }} params
 */
async function solveCaptcha({
  apiKey,
  siteKey,
  url,
  pollingIntervalMs = 10000,
  timeoutMs = 180000,
  userAgent = "DirectoryBolt-Worker/1.0.0",
}) {
  if (!apiKey) {
    throw new Error("2Captcha API key missing");
  }

  const submitResponse = await axios.post(
    SUBMIT_URL,
    new URLSearchParams({
      method: "userrecaptcha",
      key: apiKey,
      googlekey: siteKey,
      pageurl: url,
      json: "1",
    }),
    {
      timeout: 30000,
      headers: {
        "User-Agent": userAgent,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (submitResponse.data.status !== 1) {
    throw new Error(
      submitResponse.data.error_text || "2Captcha submission failed",
    );
  }

  const requestId = submitResponse.data.request;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs));

    const resultResponse = await axios.get(RESULT_URL, {
      params: {
        key: apiKey,
        action: "get",
        id: requestId,
        json: "1",
      },
      timeout: 15000,
      headers: {
        "User-Agent": userAgent,
      },
    });

    if (resultResponse.data.status === 1) {
      return resultResponse.data.request;
    }

    const errorText = resultResponse.data.error_text;
    if (errorText && errorText !== "CAPCHA_NOT_READY") {
      throw new Error(errorText);
    }
  }

  throw new Error("2Captcha timeout exceeded");
}

module.exports = {
  solveCaptcha,
};
