import { useState } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link2, Code, Quote } from 'lucide-react'

const RichTextEditor = ({ value, onChange, placeholder = "Write something...", id = "rich-text-area" }) => {
  const [isFocused, setIsFocused] = useState(false)

  const applyFormat = (format, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const textarea = document.getElementById(id)
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    let formattedText = ''
    let newCursorPos = end

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        newCursorPos = start + formattedText.length
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        newCursorPos = start + formattedText.length
        break
      case 'underline':
        formattedText = `__${selectedText}__`
        newCursorPos = start + formattedText.length
        break
      case 'code':
        formattedText = `\`${selectedText}\``
        newCursorPos = start + formattedText.length
        break
      case 'quote':
        formattedText = `> ${selectedText}`
        newCursorPos = start + formattedText.length
        break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) {
          formattedText = `[${selectedText || 'link text'}](${url})`
          newCursorPos = start + formattedText.length
        } else {
          return
        }
        break
      case 'bullet':
        formattedText = `• ${selectedText}`
        newCursorPos = start + formattedText.length
        break
      case 'numbered':
        formattedText = `1. ${selectedText}`
        newCursorPos = start + formattedText.length
        break
      case 'heading':
        formattedText = `# ${selectedText}`
        newCursorPos = start + formattedText.length
        break
      default:
        return
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end)
    onChange({ target: { value: newValue } })

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertTemplate = (template, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const textarea = document.getElementById(id)
    const start = textarea.selectionStart
    
    let templateText = ''
    switch (template) {
      case 'heading':
        templateText = '\n# Heading\n'
        break
      case 'list':
        templateText = '\n• Item 1\n• Item 2\n• Item 3\n'
        break
      case 'numbered-list':
        templateText = '\n1. First\n2. Second\n3. Third\n'
        break
      case 'divider':
        templateText = '\n---\n'
        break
      default:
        return
    }

    const newValue = value.substring(0, start) + templateText + value.substring(start)
    onChange({ target: { value: newValue } })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + templateText.length, start + templateText.length)
    }, 0)
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
          <button
            type="button"
            onClick={(e) => applyFormat('bold', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => applyFormat('italic', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => applyFormat('underline', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline size={18} />
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
          <button
            type="button"
            onClick={(e) => applyFormat('bullet', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => applyFormat('numbered', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </button>
        </div>

        {/* Special */}
        <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
          <button
            type="button"
            onClick={(e) => applyFormat('link', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Insert Link"
          >
            <Link2 size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => applyFormat('code', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Code"
          >
            <Code size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => applyFormat('quote', e)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors"
            title="Quote"
          >
            <Quote size={18} />
          </button>
        </div>

        {/* Quick Templates */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => applyFormat('heading', e)}
            className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors text-sm font-medium"
            title="Heading"
          >
            H
          </button>
          <button
            type="button"
            onClick={(e) => insertTemplate('divider', e)}
            className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 rounded transition-colors text-sm"
            title="Divider"
          >
            ---
          </button>
        </div>
      </div>

      {/* Text Area */}
      <textarea
        id={id}
        name="rich-content"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          // Prevent form submission on Enter key
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
            // Allow Enter for new line in textarea
            return
          }
        }}
        placeholder={placeholder}
        className={`w-full px-4 py-3 focus:outline-none resize-none font-mono text-sm dark:text-gray-100 ${
          isFocused ? 'bg-blue-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
        }`}
        rows="10"
        style={{ minHeight: '200px' }}
      />

      {/* Help Text */}
      <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600 px-4 py-2 text-xs text-gray-600 dark:text-gray-300">
        <div className="flex flex-wrap gap-4">
          <span><strong>**bold**</strong></span>
          <span><em>*italic*</em></span>
          <span><code>`code`</code></span>
          <span>• bullet</span>
          <span>1. numbered</span>
          <span>[link](url)</span>
          <span>&gt; quote</span>
          <span># heading</span>
        </div>
      </div>
    </div>
  )
}

export default RichTextEditor
