import { Block } from '@/components/create-block';
import { CodeEditor } from '@/components/code-editor';
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';
// import { RunFrame } from '@tscircuit/runframe/runner';

interface Metadata {
  // Instead of a list of console outputs, we now store the circuit code
  // to be rendered in the preview.
  circuitPreview?: string;
}

export const codeBlock = new Block<'code', Metadata>({
  kind: 'code',
  description:
    'Useful for code generation; Code execution is now replaced with a tscircuit runner that converts React code into circuits.',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      circuitPreview: '',
    });
  },
  onStreamPart: ({ streamPart, setBlock }) => {
    if (streamPart.type === 'code-delta') {
      setBlock((draftBlock) => ({
        ...draftBlock,
        content: streamPart.content as string,
        isVisible:
          draftBlock.status === 'streaming' &&
          draftBlock.content.length > 300 &&
          draftBlock.content.length < 310
            ? true
            : draftBlock.isVisible,
        status: 'streaming',
      }));
    }
  },
  content: ({ metadata, setMetadata, ...props }) => {
    return (
      <>
        <div className="px-1">
          <CodeEditor {...props} />
        </div>
        {/* Render the tscircuit runner preview if circuit code exists */}
        {metadata?.circuitPreview && (
          <div className="mt-4">
            <iframe src="https://runframe.tscircuit.com/iframe.html" />
          </div>
        )}
      </>
    );
  },
  actions: [
    {
      icon: <PlayIcon size={18} />,
      label: 'Run',
      description: 'Execute circuit code using tscircuit runner',
      onClick: async ({ content, setMetadata }) => {
        setMetadata((metadata) => ({
          ...metadata,
          circuitPreview: content,
        }));
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy code to clipboard',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: 'Add comments',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add comments to the code snippet for understanding',
        });
      },
    },
    {
      icon: <LogsIcon />,
      description: 'Add logs',
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Add logs to the code snippet for debugging',
        });
      },
    },
  ],
});
