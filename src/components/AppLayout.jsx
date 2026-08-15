import Sidebar from "./Sidebar";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-content">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
