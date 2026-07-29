export default function SectionPlaceholder({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note: string;
}) {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12, color: '#525252', marginBottom: 4 }}>{eyebrow}</div>
      <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0 }}>{title}</h1>
      <div
        style={{
          marginTop: 24,
          background: '#fff',
          border: '1px solid #E0E0E0',
          padding: '16px 20px',
          fontSize: 14,
          color: '#525252',
        }}
      >
        {note}
      </div>
    </div>
  );
}
