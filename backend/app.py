# Import necessary libraries
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from textblob import TextBlob
import os

# --- INITIAL SETUP ---
# Get the absolute path of the directory where this script is located
basedir = os.path.abspath(os.path.dirname(__file__))

# Create the Flask application instance
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) to allow our React frontend
# to communicate with this backend.
CORS(app)

# --- DATABASE CONFIGURATION ---
# Configure the database. We are using SQLite, a simple file-based database.
# The database file 'feedback.db' will be created in the 'backend' folder.
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'feedback.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Create the SQLAlchemy database object
db = SQLAlchemy(app)

# --- DATABASE MODEL DEFINITION ---
# This class defines the structure for the 'feedback' table in our database.
class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)  # Unique ID for each entry
    rating = db.Column(db.Integer, nullable=False)  # Star rating (1-5)
    comment = db.Column(db.String(500), nullable=True) # Patient's text comment
    sentiment = db.Column(db.String(50), nullable=False) # Analyzed sentiment

    # This helper function converts the Feedback object to a dictionary,
    # which is easy to send back to the frontend as JSON.
    def to_dict(self):
        return {
            'id': self.id,
            'rating': self.rating,
            'comment': self.comment,
            'sentiment': self.sentiment
        }

# --- API ROUTES ---
# An API route is a URL that our frontend can call to either send or get data.

# Route for submitting new feedback
@app.route('/submit', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    rating = data.get('rating')
    comment = data.get('comment')

    # --- SENTIMENT ANALYSIS ---
    analysis = TextBlob(comment)
    polarity = analysis.sentiment.polarity
    sentiment = 'Neutral'
    if polarity > 0.1:
        sentiment = 'Positive'
    elif polarity < -0.1:
        sentiment = 'Negative'

    # Create a new record for the database
    new_feedback = Feedback(rating=rating, comment=comment, sentiment=sentiment)

    # Add and save the new record to the database
    db.session.add(new_feedback)
    db.session.commit()

    return jsonify({'message': 'Feedback submitted successfully!', 'sentiment': sentiment}), 201

# Route for getting all existing feedback
@app.route('/feedback', methods=['GET'])
def get_feedback():
    all_feedback = Feedback.query.order_by(Feedback.id.desc()).all()
    # Convert all feedback records to a list of dictionaries
    result = [feedback.to_dict() for feedback in all_feedback]
    return jsonify(result)

# --- MAIN EXECUTION BLOCK ---
if __name__ == '__main__':
    # This ensures the database table is created before the app starts
    with app.app_context():
        db.create_all()
    # Run the Flask development server
    app.run(debug=True)