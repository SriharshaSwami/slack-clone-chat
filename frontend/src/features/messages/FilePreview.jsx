const FilePreview = ({ file }) => {
  if (!file) return null;

  const isImage = file.type?.startsWith('image/');

  return (
    <div style={{
      padding: 12, border: '1px solid var(--chat-border)', borderRadius: 'var(--radius)',
      background: '#FAFAFA', display: 'inline-flex', alignItems: 'center', gap: 10, margin: '4px 0',
    }}>
      {isImage ? (
        <img src={file.url} alt={file.name} style={{ maxWidth: 200, maxHeight: 150, borderRadius: 'var(--radius-sm)' }} />
      ) : (
        <>
          <span style={{ fontSize: 24 }}>📄</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
            <div style={{ fontSize: 11, color: 'var(--chat-timestamp)' }}>{file.size}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilePreview;
