interface PlaceholderViewProps {
  title: string;
  description: string;
}

export default function PlaceholderView({
  title,
  description
}: PlaceholderViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          {title}
        </h1>

        <p className="text-gray-600">
          {description}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Contenido en desarrollo
          </h3>

          <p className="text-gray-600">
            Esta sección estará disponible próximamente
          </p>
        </div>
      </div>
    </div>
  );
}