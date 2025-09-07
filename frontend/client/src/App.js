import React, { useState, useEffect } from 'react';
import axios from 'axios'; // For making API calls
import './App.css'; // For styling

function App() {
  // State variables to hold our application's data
  const [feedbackList, setFeedbackList] = useState([]); // Stores all feedback from the database
  const [rating, setRating] = useState(0); // Stores the rating from the form
  const [comment, setComment] = useState(''); // Stores the comment from the form
  const [message, setMessage] = useState(''); // Shows success/error messages to the user

  // This function fetches all the feedback from our Python backend
  const fetchFeedback = async () => {
    try {
      // Make a GET request to our backend's /feedback endpoint
      const response = await axios.get('http://127.0.0.1:5000/feedback');
      // Update the feedbackList state with the data from the backend
      setFeedbackList(response.data);
    } catch (error) {
      console.error("There was an error fetching the feedback!", error);
    }
  };

  // The useEffect hook runs once when the component first loads.
  // It's the perfect place to fetch our initial data.
  useEffect(() => {
    fetchFeedback();
  }, []);

  // This function is called when the user clicks the "Submit Feedback" button
  const handleSubmit = async (e) => {
    e.preventDefault(); // This stops the webpage from reloading on form submission

    // Basic validation to ensure the user provides a rating and comment
    if (rating === 0 || comment.trim() === '') {
      setMessage('Please select a rating and write a comment.');
      return;
    }

    try {
      // Send the new feedback to our Python backend's /submit endpoint
      const response = await axios.post('http://127.0.0.1:5000/submit', {
        rating: rating,
        comment: comment
      });

      setMessage(response.data.message); // Show the success message from the backend
      setRating(0); // Reset the form rating
      setComment(''); // Reset the form comment
      fetchFeedback(); // Immediately fetch the feedback again to show the new entry

      // Optional: Hide the success message after a few seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);

    } catch (error) {
      setMessage('Failed to submit feedback. Please try again.');
      console.error("There was an error submitting the feedback!", error);
    }
  };

  // This is the HTML structure of our application (written in JSX)
  return (
    <div className="container">
      <header>
        <h1>📝 Patient Feedback System</h1>
        <p>Your feedback helps us improve our service.</p>
      </header>

      <main>
        {/* Feedback Submission Form */}
        <div className="card form-card">
          <h2>Submit Your Feedback</h2>
          <form onSubmit={handleSubmit}>
            <div className="rating-input">
              <label>Overall Rating:</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= rating ? "star selected" : "star"}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="comment-input">
              <label htmlFor="comment">Comments:</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows="4"
              />
            </div>
            <button type="submit">Submit Feedback</button>
            {message && <p className="message">{message}</p>}
          </form>
        </div>

        {/* Display of Submitted Feedback */}
        <div className="card feedback-list-card">
          <h2>Latest Feedback</h2>
          <div className="feedback-list">
            {feedbackList.length > 0 ? (
              feedbackList.map((fb) => (
                <div key={fb.id} className="feedback-item">
                  <p className="item-rating">
                    <strong>Rating:</strong> {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                  </p>
                  <p className="item-comment">
                    <strong>Comment:</strong> "{fb.comment}"
                  </p>
                  <p className={`item-sentiment sentiment-${fb.sentiment.toLowerCase()}`}>
                    <strong>Sentiment:</strong> {fb.sentiment}
                  </p>
                </div>
              ))
            ) : (
              <p>No feedback has been submitted yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;