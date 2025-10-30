'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        .brand-logo {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .elegant-text {
          font-family: 'Inter', sans-serif;
        }
        
        .section-title {
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .elegant-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          border-radius: 10px;
          padding: 0.8rem 1.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .elegant-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .success-icon {
          animation: scaleIn 0.5s ease-in-out;
        }
        
        @keyframes scaleIn {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="bg-white p-5 rounded shadow-sm text-center">
              {/* Success Icon */}
              <div className="mb-4 success-icon">
                <i className="bi bi-check-circle-fill" style={{ fontSize: '5rem', color: '#28a745' }}></i>
              </div>

              {/* Success Message */}
              <h2 className="section-title mb-3">Commande confirmée!</h2>
              
              <p className="elegant-text text-muted mb-4">
                Merci pour votre commande. Nous avons bien reçu votre demande et nous vous contacterons bientôt pour confirmer les détails de livraison.
              </p>

              {/* Order Number */}
              {orderNumber && (
                <div className="p-3 mb-4 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <p className="elegant-text mb-1 small text-muted">Numéro de commande</p>
                  <h4 className="mb-0" style={{ color: '#2196F3', fontWeight: '600' }}>
                    {orderNumber}
                  </h4>
                </div>
              )}

              {/* Info */}
              <div className="mb-4 text-start">
                <div className="d-flex align-items-start mb-3">
                  <i className="bi bi-telephone-fill me-3 mt-1" style={{ color: '#667eea', fontSize: '1.2rem' }}></i>
                  <div>
                    <p className="elegant-text fw-medium mb-1">Nous vous appellerons</p>
                    <p className="elegant-text small text-muted mb-0">
                      Notre équipe vous contactera dans les plus brefs délais pour confirmer votre commande
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start mb-3">
                  <i className="bi bi-truck me-3 mt-1" style={{ color: '#667eea', fontSize: '1.2rem' }}></i>
                  <div>
                    <p className="elegant-text fw-medium mb-1">Livraison gratuite</p>
                    <p className="elegant-text small text-muted mb-0">
                      Livraison gratuite partout au Maroc
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <i className="bi bi-cash me-3 mt-1" style={{ color: '#667eea', fontSize: '1.2rem' }}></i>
                  <div>
                    <p className="elegant-text fw-medium mb-1">Paiement à la livraison</p>
                    <p className="elegant-text small text-muted mb-0">
                      Vous payez lorsque vous recevez votre commande
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-column gap-2">
                <Link href="/" className="btn elegant-button w-100 text-decoration-none">
                  <i className="bi bi-house-door me-2"></i>
                  Retour à l'accueil
                </Link>
                <Link href="/cart" className="btn btn-outline-secondary w-100 text-decoration-none" style={{ borderRadius: '10px' }}>
                  <i className="bi bi-bag me-2"></i>
                  Nouvelle commande
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border" style={{ color: '#667eea' }} role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
