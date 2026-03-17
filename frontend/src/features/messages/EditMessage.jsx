import { useState } from 'react';

const EditMessage = ({ message, onSave, onCancel }) => {
  const [text, setText] = useState(message?.text || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) onSave?.(text.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          flex: 1, padding: '6px 10px', border: '1px solid var(--input-border)',
          borderRadius: 'var(--radius-sm)', fontSize: 14,
        }}
        autoFocus
      />
      <button type="submit" style={{
        padding: '6px 14px', background: 'var(--slack-green)', color: '#fff',
        borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
      }}>Save</button>
      <button type="button" onClick={onCancel} style={{
        padding: '6px 14px', background: '#F0F0F0', color: 'var(--chat-text)',
        borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
      }}>Cancel</button>
    </form>
  );
};

export default EditMessage;
