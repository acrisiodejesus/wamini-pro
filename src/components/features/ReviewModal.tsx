'use client';

import React, { useState } from 'react';
import { X, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StarRating from '@/components/ui/StarRating';
import { createReview } from '@/lib/api/services/reviews';
import { useQueryClient } from '@tanstack/react-query';

const MAX_COMMENT = 300;

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The user being reviewed (the other party in the negotiation) */
  targetUser: { id: number; name: string };
  negotiationId: number;
}

export default function ReviewModal({ isOpen, onClose, targetUser, negotiationId }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const charsLeft = MAX_COMMENT - comment.length;
  const canSubmit = rating > 0 && !submitting;

  const handleClose = () => {
    setRating(0);
    setComment('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      await createReview({
        target_id: targetUser.id,
        rating,
        comment: comment.trim() || undefined,
      });

      // Invalidate cache so UserReviews section re-fetches
      queryClient.invalidateQueries({ queryKey: ['reviews', targetUser.id] });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Erro ao submeter avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Avaliar ${targetUser.name}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Fechar"
            >
              <X size={20} className="text-gray-400" />
            </button>

            {/* Gradient header */}
            <div
              className="h-28 flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
            >
              <div className="bg-white p-3 rounded-2xl shadow-lg">
                <Star size={36} className="text-yellow-500 fill-yellow-400" />
              </div>
            </div>

            <div className="p-6 pt-5">
              {success ? (
                /* ── Success state ── */
                <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                  >
                    <CheckCircle2 size={56} className="text-green-500" />
                  </motion.div>
                  <h2 className="text-xl font-black text-gray-900">Avaliação enviada!</h2>
                  <p className="text-gray-500 text-sm">
                    A tua avaliação de <strong>{targetUser.name}</strong> foi registada com sucesso.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 w-full py-3 rounded-2xl font-black text-black text-sm"
                    style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                /* ── Form state ── */
                <>
                  <h2 className="text-xl font-black text-gray-900 text-center leading-tight">
                    Avaliar {targetUser.name}
                  </h2>
                  <p className="text-center text-gray-500 text-sm mt-1 mb-5">
                    Como correu a negociação?
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Star picker */}
                    <div className="flex flex-col items-center gap-2">
                      <StarRating value={rating} onChange={setRating} size="lg" />
                      <span className="text-xs text-gray-400">
                        {rating === 0
                          ? 'Toca para classificar'
                          : ['', 'Muito mau', 'Mau', 'Razoável', 'Bom', 'Excelente'][rating]}
                      </span>
                    </div>

                    {/* Comment */}
                    <div>
                      <label
                        htmlFor="review-comment"
                        className="block text-sm font-semibold text-gray-700 mb-1"
                      >
                        Comentário <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                        placeholder="Descreve a tua experiência…"
                        rows={3}
                        maxLength={MAX_COMMENT}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
                      />
                      <p
                        className={`text-right text-xs mt-1 ${charsLeft < 30 ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}
                      >
                        {charsLeft} caracteres restantes
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <p role="alert" className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">
                        {error}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full py-3.5 rounded-2xl font-black text-black text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #D8FF12 0%, #FBB03B 100%)' }}
                      aria-disabled={!canSubmit}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          A enviar…
                        </>
                      ) : (
                        <>
                          <Star size={18} />
                          Enviar Avaliação
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
