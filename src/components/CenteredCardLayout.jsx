export default function CenteredCardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
      <div className="bg-white shadow rounded p-8 w-full max-w-md mb-10">
        {children}
      </div>
    </div>
  );
}
