import { ArrowLeft, LayoutGrid, ImageDown } from 'lucide-react';

type Props = {
  mapName: string;
  onBack: () => void;
  onAutoArrange: () => void;
  onExportImage: () => void;
  exportingImage?: boolean;
};

export function CanvasToolbar({ mapName, onBack, onAutoArrange, onExportImage, exportingImage }: Props) {
  return (
    <div className="km-cvtop km-glass">
      <ToolbarButton icon={<ArrowLeft />} label="Maps" onClick={onBack} />
      <div className="km-cvtop__sep" />
      <span className="km-cvtop__crumb">{mapName}</span>
      <div className="km-cvtop__sep" />
      <ToolbarButton icon={<LayoutGrid />} label="Auto arrange" onClick={onAutoArrange} />
      <ToolbarButton
        icon={<ImageDown />}
        label={exportingImage ? 'Exporting…' : 'Export PNG'}
        onClick={onExportImage}
        disabled={exportingImage}
      />
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button onClick={onClick} title={label} disabled={disabled} className="km-cvtop__btn">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
