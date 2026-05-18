import React from 'react'

const colorPalettes = [
  {
    name: 'Ocean',
    colors: [
      { name: 'Blue', bg: 'bg-blue-600', border: 'border-blue-600', bgOpacity: 'bg-blue-600/20', borderOpacity: 'border-blue-600/30' },
      { name: 'Cyan', bg: 'bg-cyan-600', border: 'border-cyan-600', bgOpacity: 'bg-cyan-600/20', borderOpacity: 'border-cyan-600/30' },
      { name: 'Teal', bg: 'bg-teal-600', border: 'border-teal-600', bgOpacity: 'bg-teal-600/20', borderOpacity: 'border-teal-600/30' },
    ]
  },
  {
    name: 'Sunset',
    colors: [
      { name: 'Orange', bg: 'bg-orange-600', border: 'border-orange-600', bgOpacity: 'bg-orange-600/20', borderOpacity: 'border-orange-600/30' },
      { name: 'Red', bg: 'bg-red-600', border: 'border-red-600', bgOpacity: 'bg-red-600/20', borderOpacity: 'border-red-600/30' },
      { name: 'Pink', bg: 'bg-pink-600', border: 'border-pink-600', bgOpacity: 'bg-pink-600/20', borderOpacity: 'border-pink-600/30' },
    ]
  },
  {
    name: 'Nature',
    colors: [
      { name: 'Green', bg: 'bg-green-600', border: 'border-green-600', bgOpacity: 'bg-green-600/20', borderOpacity: 'border-green-600/30' },
      { name: 'Lime', bg: 'bg-lime-600', border: 'border-lime-600', bgOpacity: 'bg-lime-600/20', borderOpacity: 'border-lime-600/30' },
      { name: 'Emerald', bg: 'bg-emerald-600', border: 'border-emerald-600', bgOpacity: 'bg-emerald-600/20', borderOpacity: 'border-emerald-600/30' },
    ]
  },
  {
    name: 'Royal',
    colors: [
      { name: 'Purple', bg: 'bg-purple-600', border: 'border-purple-600', bgOpacity: 'bg-purple-600/20', borderOpacity: 'border-purple-600/30' },
      { name: 'Indigo', bg: 'bg-indigo-600', border: 'border-indigo-600', bgOpacity: 'bg-indigo-600/20', borderOpacity: 'border-indigo-600/30' },
      { name: 'Violet', bg: 'bg-violet-600', border: 'border-violet-600', bgOpacity: 'bg-violet-600/20', borderOpacity: 'border-violet-600/30' },
    ]
  },
  {
    name: 'Warm',
    colors: [
      { name: 'Amber', bg: 'bg-amber-600', border: 'border-amber-600', bgOpacity: 'bg-amber-600/20', borderOpacity: 'border-amber-600/30' },
      { name: 'Yellow', bg: 'bg-yellow-600', border: 'border-yellow-600', bgOpacity: 'bg-yellow-600/20', borderOpacity: 'border-yellow-600/30' },
      { name: 'Rose', bg: 'bg-rose-600', border: 'border-rose-600', bgOpacity: 'bg-rose-600/20', borderOpacity: 'border-rose-600/30' },
    ]
  },
]

const ColorPalettePicker = ({ selectedColor, onColorSelect, title = 'Select Color' }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h4>
      <div className="space-y-3">
        {colorPalettes.map((palette) => (
          <div key={palette.name} className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{palette.name}</p>
            <div className="flex gap-2 flex-wrap">
              {palette.colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onColorSelect(color)}
                  className={`w-10 h-10 rounded-lg ${color.bg} hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color.name.split('-')[1]}-500 ${
                    selectedColor?.name === color.name ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                  }`}
                  title={color.name}
                  aria-label={`Select ${color.name}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ColorPalettePicker
