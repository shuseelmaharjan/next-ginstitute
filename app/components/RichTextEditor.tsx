import React, { useEffect, useState } from "react";
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, List, Underline as UnderlineIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TiptapMenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
      <Button
        type="button"
        variant={editor.isActive('bold') ? 'default' : 'outline'}
        size="icon"
        className="rounded-full transition-colors duration-150 hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold size={18} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('italic') ? 'default' : 'outline'}
        size="icon"
        className="rounded-full transition-colors duration-150 hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic size={18} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('underline') ? 'default' : 'outline'}
        size="icon"
        className="rounded-full transition-colors duration-150 hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
      >
        <UnderlineIcon size={18} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
        size="icon"
        className="rounded-full transition-colors duration-150 hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
      >
        <List size={18} />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
        size="icon"
        className="rounded-full transition-colors duration-150 hover:bg-gray-200"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
      >
        <List size={18} className="rotate-90" />
      </Button>
    </div>
  );
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'tiptap-content min-h-[120px] px-3 py-2 outline-none text-base bg-white border-1 rounded-lg',
        placeholder: placeholder || '',
      },
    },
    immediatelyRender: false,
  });

  // Only render the editor UI after mount
  if (!mounted || !editor) return null;

  return (
    <div className="border rounded-lg p-2 bg-white focus-within:ring-2 focus-within:ring-gray-300 shadow-xs">
      <TiptapMenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
