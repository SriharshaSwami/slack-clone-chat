import { useState, useCallback } from 'react';
import Modal from './Modal';

export function useModal() {
  const [modal, setModal] = useState(null);

  const showModal = useCallback((content, title = '', onClose) => {
    setModal({ content, title, onClose });
  }, []);

  const hideModal = useCallback(() => {
    if (modal?.onClose) modal.onClose();
    setModal(null);
  }, [modal]);

  const modalElement = modal ? (
    <Modal open={true} onClose={hideModal} title={modal.title}>
      {modal.content}
    </Modal>
  ) : null;

  return [modalElement, showModal, hideModal];
}
