export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="max-w-lg w-full text-center space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Жалал-Абадский колледж
        </h1>
        <p className="text-lg text-gray-600">
          Автоматизация приемной комиссии (ЖАК ЖАГУ)
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 text-left">
          <h2 className="font-semibold text-gray-800">Для абитуриентов:</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Подача заявления онлайн</li>
            <li>Загрузка документов</li>
            <li>Выбор специальности</li>
            <li>Отслеживание статуса</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row justify-center">
          <a
            href="/applicant"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            Личный кабинет
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px]"
          >
            Регистрация
          </a>
          <a
            href="/moderator"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            Панель комиссии
          </a>
        </div>
        <p className="text-sm text-gray-500">
          Документы: аттестат, паспорт, справка 086
        </p>
      </div>
    </div>
  );
}