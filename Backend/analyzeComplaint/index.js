const axios = require("axios");
const lemmatizer = require("wink-lemmatizer");

module.exports = async function (context, req) {
  try {
    // Read from environment variables
    const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT;
    const apiKey = process.env.AZURE_LANGUAGE_KEY;
    const inputText = req.body.text || "";

    // ---------------------------
    // 1. Sentiment Analysis
    // ---------------------------
    const sentimentResponse = await axios.post(
      `${endpoint}/text/analytics/v3.1/sentiment`,
      {
        documents: [{ id: "1", language: "en", text: inputText }]
      },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    const sentimentDoc = sentimentResponse.data.documents[0];
    const sentiment = sentimentDoc.sentiment;
    const confidenceScores = sentimentDoc.confidenceScores;

    // ---------------------------
    // 2. Key Phrase Extraction
    // ---------------------------
    const keyPhraseResponse = await axios.post(
      `${endpoint}/text/analytics/v3.1/keyPhrases`,
      {
        documents: [{ id: "1", language: "en", text: inputText }]
      },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );

    let keyPhrases = keyPhraseResponse.data.documents[0].keyPhrases.map(p => p.toLowerCase());
    keyPhrases = keyPhrases.map(p => lemmatizer.noun(p) || lemmatizer.verb(p) || p);

    // ---------------------------
    // 3. Token-level Lemmatization
    // ---------------------------
    const rawTokens = inputText.toLowerCase().split(/\W+/); // crude tokenizer
    const lemmatizedTokens = rawTokens.map(t => lemmatizer.noun(t) || lemmatizer.verb(t) || t);
    const allPhrases = [...new Set([...keyPhrases, ...lemmatizedTokens])];

    // Debug logs
    context.log("📚 Key Phrases:", keyPhrases);
    context.log("🧠 Lemmatized Tokens:", lemmatizedTokens);
    context.log("📦 Combined All Phrases:", allPhrases);
    context.log("🧪 Sentiment Scores:", confidenceScores);

    // ---------------------------
    // 4. Rule-based Classification (Improved)
    // ---------------------------
    let classification = "General";
    let urgency = "Low";
    let recommendedAction = "Review manually";

    if (
      sentiment === "positive" ||
      allPhrases.some(p =>
        ["best", "amazing", "excellent", "supportive", "kind", "helpful", "satisfied", "great", "cooperative"].some(term => p.includes(term))
      )
    ) {
      classification = "Appreciation";
      urgency = "None";
      recommendedAction = "Log as positive feedback";

    } else if (
      allPhrases.some(p =>
        ["abuse", "violence", "hit", "slap", "assault", "hurt", "kick", "beat"].some(term => p.includes(term))
      )
    ) {
      classification = "Physical Abuse";
      urgency = "High";
      recommendedAction = "Immediate escalation to authority";

    } else if (
      allPhrases.some(p =>
        ["yell", "shout", "scream", "curse", "insult"].some(term => p.includes(term))
      )
    ) {
      classification = "Verbal Abuse";
      urgency = "Medium";
      recommendedAction = "Report to HR";

    } else if (
      allPhrases.some(p =>
        ["delay", "wait", "waiting", "slow", "hold", "late"].some(term => p.includes(term))
      )
    ) {
      classification = "Service Delay";
      urgency = "Medium";
      recommendedAction = "Notify service supervisor";

    } else if (
      allPhrases.some(p =>
        ["rude", "unhelpful", "negligent", "ignore", "neglect", "staff"].some(term => p.includes(term))
      )
    ) {
      classification = "Negligence";
      urgency = "Medium";
      recommendedAction = "Forward to admin";

    } else if (
      allPhrases.some(p =>
        ["discriminate", "racist", "sexist", "bias", "prejudice"].some(term => p.includes(term))
      )
    ) {
      classification = "Discrimination";
      urgency = "High";
      recommendedAction = "Investigate immediately";

    } else if (
      allPhrases.some(p =>
        ["pain", "painful", "injury", "sick", "wound", "bleed", "ill", "burn", "dizzy", "faint", "vomit", "fever"].some(term => p.includes(term))
      )
    ) {
      classification = "Health Concern";
      urgency = "High";
      recommendedAction = "Immediate medical attention";

    } else if (sentiment === "negative" && confidenceScores.negative >= 0.95) {
      classification = "Serious Complaint";
      urgency = "Medium";
      recommendedAction = "Escalate for manual review";
    }

    // ---------------------------
    // 5. Response
    // ---------------------------
    context.res = {
      status: 200,
      body: {
        message: "Complaint analyzed successfully",
        input: inputText,
        classification,
        sentiment,
        confidenceScores,
        urgency,
        recommendedAction,
        keyPhrases
      }
    };
  } catch (error) {
    context.log("❌ ERROR:", error.message);
    context.res = {
      status: 500,
      body: {
        error: "Internal Server Error",
        details: error.message
      }
    };
  }
};
