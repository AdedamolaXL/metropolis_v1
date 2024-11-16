import React from 'react';
import { GameBoardSpace } from '../../../backend/shared/types';

interface ActionModalProps {
  tile: GameBoardSpace;
  onClose: () => void;
  onBuyProperty: () => void;
  onPayRent: () => void;
  onDrawCard: () => void;
  isOwned: boolean;
  isCurrentPlayer: boolean;
}

const ActionModal: React.FC<ActionModalProps> = ({
  tile,
  onClose,
  onBuyProperty,
  onPayRent,
  onDrawCard,
  isOwned,
  isCurrentPlayer,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{tile.name}</h3>
        <p>Price: ${tile.price || 'N/A'}</p>

        {/* Render actions based on tile type and ownership */}
        {tile.type === 'AVENUE' || tile.type === 'RAILROADS' || tile.type === 'ELECTRIC' || tile.type === 'WATER' ? (
          <>
            {isOwned ? (
              <button onClick={onPayRent}>Pay Rent</button>
            ) : isCurrentPlayer ? (
              <button onClick={onBuyProperty}>Buy Property</button>
            ) : (
              <p>Not your turn</p>
            )}
          </>
        ) : tile.type === 'CHANCE' || tile.type === 'COMMUNITY' ? (
          <button onClick={onDrawCard}>Draw Card</button>
        ) : (
          <p>No actions available on this tile.</p>
        )}

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ActionModal;
