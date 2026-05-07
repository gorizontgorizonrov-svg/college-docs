"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Нет подключения к интернету</h1>
        <p className="text-gray-600">
          Проверьте подключение и попробуйте снова
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg min-h-[44px]"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}