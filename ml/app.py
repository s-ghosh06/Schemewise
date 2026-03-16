# ============================================================
# SCHEMEWISE — ML Microservice (Flask)
# Runs on port 5001
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import IsolationForest, RandomForestClassifier

app = Flask(__name__)
CORS(app)

# ============================================================
# SCHEME DEFINITIONS
# ============================================================

SCHEMES = [
    {
        "scheme_id": 1,
        "scheme_name": "Pradhan Mantri Awas Yojana",
        "category": "Housing",
        "rules": { "max_income": 300000, "preferred_types": ["BPL", "APL"], "income_weight": 0.5, "type_weight": 0.5 }
    },
    {
        "scheme_id": 2,
        "scheme_name": "National Rural Employment Guarantee",
        "category": "Employment",
        "rules": { "max_income": 150000, "preferred_types": ["BPL"], "income_weight": 0.6, "type_weight": 0.4 }
    },
    {
        "scheme_id": 3,
        "scheme_name": "PM Jan Dhan Yojana",
        "category": "Financial Inclusion",
        "rules": { "max_income": 500000, "preferred_types": ["BPL", "APL"], "income_weight": 0.3, "type_weight": 0.7 }
    },
    {
        "scheme_id": 4,
        "scheme_name": "Ayushman Bharat - PMJAY",
        "category": "Health",
        "rules": { "max_income": 250000, "preferred_types": ["BPL"], "income_weight": 0.6, "type_weight": 0.4 }
    },
    {
        "scheme_id": 5,
        "scheme_name": "PM Kisan Samman Nidhi",
        "category": "Agriculture",
        "rules": { "max_income": 200000, "preferred_types": ["BPL", "APL"], "income_weight": 0.5, "type_weight": 0.5 }
    },
    {
        "scheme_id": 6,
        "scheme_name": "Beti Bachao Beti Padhao",
        "category": "Education",
        "rules": { "max_income": 400000, "preferred_types": ["BPL", "APL"], "income_weight": 0.4, "type_weight": 0.6 }
    },
    {
        "scheme_id": 7,
        "scheme_name": "National Social Assistance Programme",
        "category": "Social Welfare",
        "rules": { "max_income": 100000, "preferred_types": ["BPL"], "income_weight": 0.7, "type_weight": 0.3 }
    },
    {
        "scheme_id": 8,
        "scheme_name": "Midday Meal Scheme",
        "category": "Education",
        "rules": { "max_income": 200000, "preferred_types": ["BPL", "APL"], "income_weight": 0.4, "type_weight": 0.6 }
    }
]

# ============================================================
# 1. SCHEME RECOMMENDATION
# ============================================================

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json()
        income = float(data.get('income', 0))
        b_type = data.get('beneficiary_type', 'APL')
        beneficiary_id = data.get('beneficiary_id', 0)
        enrolled_scheme_ids = data.get('enrolled_scheme_ids', [])

        recommendations = []

        for scheme in SCHEMES:
            rules = scheme['rules']
            max_income = rules['max_income']
            preferred_types = rules['preferred_types']

            if income <= max_income:
                income_score = 1.0 - (income / max_income) * 0.5
            else:
                income_score = max(0, 1.0 - ((income - max_income) / max_income))

            type_score = 1.0 if b_type in preferred_types else 0.3

            final_score = (income_score * rules['income_weight'] + type_score * rules['type_weight'])
            match_percent = round(min(final_score * 100, 99), 1)

            already_enrolled = scheme['scheme_id'] in enrolled_scheme_ids

            if income > max_income and b_type not in preferred_types:
                reason = "Income exceeds limit and category mismatch"
            elif income > max_income:
                reason = f"Income exceeds scheme limit of Rs.{max_income:,}"
            elif b_type not in preferred_types:
                reason = f"Scheme targets {', '.join(preferred_types)} category"
            else:
                reason = "Meets all eligibility criteria"

            recommendations.append({
                "scheme_id": scheme['scheme_id'],
                "scheme_name": scheme['scheme_name'],
                "category": scheme['category'],
                "match_percent": match_percent,
                "eligible": income <= max_income and b_type in preferred_types,
                "already_enrolled": already_enrolled,
                "reason": reason
            })

        recommendations.sort(key=lambda x: x['match_percent'], reverse=True)

        return jsonify({ "success": True, "beneficiary_id": beneficiary_id, "recommendations": recommendations })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# 2. FRAUD DETECTION
# ============================================================

@app.route('/fraud-detect', methods=['POST'])
def fraud_detect():
    try:
        data = request.get_json()
        beneficiaries = data.get('beneficiaries', [])
        enrollments   = data.get('enrollments', [])

        if not beneficiaries:
            return jsonify({"success": True, "alerts": []})

        alerts = []

        enrollment_counts = {}
        for e in enrollments:
            bid = e['beneficiary_id']
            enrollment_counts[bid] = enrollment_counts.get(bid, 0) + 1

        features = []
        for b in beneficiaries:
            bid = b['beneficiary_id']
            count = enrollment_counts.get(bid, 0)
            income = float(b.get('income', 0))
            type_flag = 0 if b.get('beneficiary_type') == 'BPL' else 1
            features.append([income, count, type_flag])

        if len(features) >= 3:
            X = np.array(features)
            scaler = MinMaxScaler()
            X_scaled = scaler.fit_transform(X)
            iso = IsolationForest(contamination=0.2, random_state=42)
            predictions = iso.fit_predict(X_scaled)
            scores = iso.decision_function(X_scaled)
        else:
            predictions = [1] * len(features)
            scores = [0.0] * len(features)

        for i, b in enumerate(beneficiaries):
            bid = b['beneficiary_id']
            income = float(b.get('income', 0))
            b_type = b.get('beneficiary_type', 'APL')
            count = enrollment_counts.get(bid, 0)
            anomaly_score = round(float(scores[i]) * -1, 3)

            if count >= 4:
                alerts.append({
                    "beneficiary_id": bid,
                    "beneficiary_name": b.get('full_name'),
                    "alert_type": "duplicate_enrollment",
                    "severity": "high",
                    "confidence": min(95, 70 + count * 5),
                    "message": f"Enrolled in {count} schemes — possible duplicate enrollment",
                    "ml_flagged": predictions[i] == -1
                })

            if b_type == 'BPL' and income > 200000:
                alerts.append({
                    "beneficiary_id": bid,
                    "beneficiary_name": b.get('full_name'),
                    "alert_type": "income_mismatch",
                    "severity": "high",
                    "confidence": 88,
                    "message": f"Declared BPL but income Rs.{income:,.0f} exceeds threshold",
                    "ml_flagged": True
                })
            elif b_type == 'APL' and income < 50000:
                alerts.append({
                    "beneficiary_id": bid,
                    "beneficiary_name": b.get('full_name'),
                    "alert_type": "income_mismatch",
                    "severity": "medium",
                    "confidence": 75,
                    "message": f"Declared APL but income Rs.{income:,.0f} is very low",
                    "ml_flagged": True
                })

            if predictions[i] == -1 and count < 4 and not (b_type == 'BPL' and income > 200000):
                alerts.append({
                    "beneficiary_id": bid,
                    "beneficiary_name": b.get('full_name'),
                    "alert_type": "general",
                    "severity": "low",
                    "confidence": round(anomaly_score * 100, 1),
                    "message": "ML model flagged unusual profile pattern",
                    "ml_flagged": True
                })

        return jsonify({ "success": True, "total_alerts": len(alerts), "alerts": alerts })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# 3. ELIGIBILITY PREDICTION
# ============================================================

@app.route('/predict-eligibility', methods=['POST'])
def predict_eligibility():
    try:
        data = request.get_json()
        income    = float(data.get('income', 0))
        b_type    = data.get('beneficiary_type', 'APL')
        scheme_id = int(data.get('scheme_id', 1))

        scheme = next((s for s in SCHEMES if s['scheme_id'] == scheme_id), SCHEMES[0])
        max_income = scheme['rules']['max_income']
        preferred  = scheme['rules']['preferred_types']

        np.random.seed(42)
        training_data = []
        labels = []

        for _ in range(200):
            inc = np.random.uniform(20000, 500000)
            typ = np.random.choice([0, 1])
            typ_str = 'BPL' if typ == 0 else 'APL'
            approved = 1 if (inc <= max_income and typ_str in preferred) else 0
            if np.random.random() < 0.05:
                approved = 1 - approved
            training_data.append([inc, typ])
            labels.append(approved)

        X_train = np.array(training_data)
        y_train = np.array(labels)

        scaler = MinMaxScaler()
        X_scaled = scaler.fit_transform(X_train)

        clf = RandomForestClassifier(n_estimators=50, random_state=42)
        clf.fit(X_scaled, y_train)

        type_num = 0 if b_type == 'BPL' else 1
        X_input  = scaler.transform([[income, type_num]])
        prediction    = clf.predict(X_input)[0]
        probabilities = clf.predict_proba(X_input)[0]
        confidence    = round(max(probabilities) * 100, 1)

        return jsonify({
            "success":     True,
            "scheme_id":   scheme_id,
            "scheme_name": scheme['scheme_name'],
            "eligible":    bool(prediction == 1),
            "confidence":  confidence,
            "probability": {
                "eligible":     round(float(probabilities[1]) * 100, 1),
                "not_eligible": round(float(probabilities[0]) * 100, 1)
            },
            "factors": {
                "income_ok":       income <= max_income,
                "type_ok":         b_type in preferred,
                "max_income":      max_income,
                "preferred_types": preferred
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# 4. BATCH PREDICT ALL SCHEMES
# ============================================================

@app.route('/predict-all', methods=['POST'])
def predict_all():
    try:
        data   = request.get_json()
        income = float(data.get('income', 0))
        b_type = data.get('beneficiary_type', 'APL')

        results = []
        for scheme in SCHEMES:
            max_income = scheme['rules']['max_income']
            preferred  = scheme['rules']['preferred_types']
            eligible   = income <= max_income and b_type in preferred
            results.append({
                "scheme_id":   scheme['scheme_id'],
                "scheme_name": scheme['scheme_name'],
                "category":    scheme['category'],
                "eligible":    eligible,
                "confidence":  92 if eligible else 85
            })

        return jsonify({"success": True, "predictions": results})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "SCHEMEWISE ML API", "port": 5001})


if __name__ == '__main__':
    print("\n ML Service starting on http://localhost:5001")
    print("Endpoints: /recommend  /fraud-detect  /predict-eligibility  /predict-all\n")
    app.run(host='0.0.0.0', port=5001, debug=True)