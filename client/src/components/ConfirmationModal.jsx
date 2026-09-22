export default function ConfirmationModal({ signupData, onClose }) {
  if (!signupData) return null;

  const { volunteer, event } = signupData;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-icon">🎉</div>
        <h2>Sign-Up Confirmed!</h2>
        <p className="modal-subtitle">
          Thank you, <strong>{volunteer?.fullName || "Volunteer"}</strong>! You are officially registered.
        </p>

        <div className="modal-details">
          <div className="detail-row">
            <span className="detail-label">Event:</span>
            <span className="detail-value">{event?.title}</span>
          </div>
          {event?.eventDate && (
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{event.eventDate}</span>
            </div>
          )}
          {event?.location && (
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{event.location}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Confirmation Email:</span>
            <span className="detail-value">{volunteer?.email}</span>
          </div>
        </div>

        <button className="btn-primary modal-close-btn" onClick={onClose}>
          Sign Up Another Volunteer
        </button>
      </div>
    </div>
  );
}

