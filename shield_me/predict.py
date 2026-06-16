import joblib
import os
import warnings
warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, "model (1).pkl"))
vectorizer = joblib.load(os.path.join(BASE_DIR, "vectorizer (1).pkl"))

def predict_email(email_text):
    email_vector = vectorizer.transform([email_text])
    result = model.predict(email_vector)

    if result[0] == 1:
        classification = "Spam"
        risk_level = "High"
        email_lower = email_text.lower()

        if any(word in email_lower for word in ["password", "login", "verify", "account"]):
            threat_type = "Phishing Attack"
            details = "This email attempts to obtain sensitive account information"
            tips = [
                "Never share passwords",
                "Do not click unknown links",
                "Verify the sender through official channels"
            ]

        elif any(word in email_lower for word in ["winner", "prize", "lottery", "reward"]):
            threat_type = "Prize Scam"
            details = "The message promises rewards or prizes to attract victims"
            tips = [
                "Ignore unexpected rewards",
                "Do not provide personal information",
                "Verify offers from official sources"
            ]

        elif any(word in email_lower for word in ["bank", "payment", "credit card"]):
            threat_type = "Financial Fraud"
            details = "The email appears to request financial or banking information"
            tips = [
                "Never share banking details",
                "Contact the bank directly",
                "Avoid making payments through suspicious links"
            ]

        else:
            threat_type = "General Spam"
            details = "The email contains characteristics commonly found in spam messages"
            tips = [
                "Be cautious with attachments",
                "Verify the sender identity",
                "Do not disclose sensitive information"
            ]

        return {
            "classification": classification,
            "risk_level": risk_level,
            "threat_type": threat_type,
            "details": details,
            "tips": tips
        }

    else:
        return {
            "classification": "Safe",
            "risk_level": "Low",
            "details": "No significant spam indicators were detected",
            "tips": ["Continue following normal cybersecurity practices", "Always verify unexpected requests"]
        }