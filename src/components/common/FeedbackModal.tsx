import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Star, Heart, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const FeedbackModal: React.FC = () => {
  const { isFeedbackOpen, setIsFeedbackOpen, activePlan } = useFinance();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comments, setComments] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isFeedbackOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsFeedbackOpen(false);
      setComments('');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md glass-card-raised rounded-card border border-border p-6 shadow-glass animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-danger" />
            <h3 className="text-sm font-bold text-text-primary">Plan Clarity Feedback</h3>
          </div>
          <button
            onClick={() => setIsFeedbackOpen(false)}
            className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-brand-lightGreen mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-text-primary">Thank you for your review!</h4>
            <p className="text-xs text-text-secondary">Your feedback helps refine our wealth architectures.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            <div>
              <label className="text-xs text-text-secondary block mb-2 font-medium">
                How clear and actionable is the <strong className="text-text-primary">{activePlan?.name || 'Financial Plan'}</strong>?
              </label>
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating !== null ? star <= hoverRating : star <= rating)
                          ? 'fill-warning text-warning'
                          : 'text-text-tertiary'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-secondary block mb-1 font-medium">
                Any specific comments or suggestions? (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={500}
                placeholder="E.g., Very clear explanation of the debt vs equity split..."
                rows={3}
                className="w-full bg-surface border border-border rounded-2xl p-3 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand-green outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-green"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
