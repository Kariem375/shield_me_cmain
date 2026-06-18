import joblib
import os
import re
from urllib.parse import urlparse
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

url_model = joblib.load(os.path.join(BASE_DIR, "url_model.pkl"))
url_columns = joblib.load(os.path.join(BASE_DIR, "url_columns.pkl"))

def extract_features(url):
    parsed = urlparse(url)
    hostname = parsed.netloc or ''
    path = parsed.path or ''

    features = {}
    features['url_length'] = len(url)
    features['count_dots'] = url.count('.')
    features['count_slash'] = url.count('/')
    features['count_digits'] = sum(c.isdigit() for c in url)
    features['digit_ratio'] = features['count_digits'] / features['url_length'] if features['url_length'] > 0 else 0
    features['is_https'] = 1 if parsed.scheme == 'https' else 0
    features['has_ip'] = 1 if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', hostname.split(':')[0]) else 0
    features['path_length'] = len(path)
    features['hostname_length'] = len(hostname)
    features['count_subdomains'] = max(hostname.split(':')[0].count('.') - 1, 0)

    return features

def predict_url(url):
    feats = extract_features(url)
    df = pd.DataFrame([feats]).reindex(columns=url_columns, fill_value=0)
    result = url_model.predict(df)[0]
    proba = url_model.predict_proba(df)[0]
    confidence = round(float(max(proba)) * 100, 2)

    if result == 1:
        return {
            "classification": "Unsafe",
            "confidence": f"{confidence}%",
            "risk_level": "High",
            "details": "This URL contains characteristics commonly found in malicious links",
            "tips": [
                "Do not open this link",
                "Avoid entering any personal information",
                "Report the URL to your security team"
            ]
        }
    else:
        return {
            "classification": "Safe",
            "confidence": f"{confidence}%",
            "risk_level": "Low",
            "details": "No significant threats were detected in this URL",
            "tips": ["Always verify links before clicking", "Continue following normal cybersecurity practices"]
        }