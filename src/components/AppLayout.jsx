import Sidebar from "./Sidebar";

function AppLayout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          overflow: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default AppLayout;