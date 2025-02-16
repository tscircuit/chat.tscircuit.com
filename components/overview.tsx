import { motion } from 'framer-motion';
import Link from 'next/link';

import { MessageIcon, VercelIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <VercelIcon size={32} />
          <span>+</span>
          <MessageIcon size={32} />
        </p>
        <p>
          This is an{' '}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://github.com/tscircuit/tscircuit"
            target="_blank"
          >
            open source
          </Link>{' '}
          chatbot that allows you to create and preview electronic circuit boards using <Link
            className="font-medium underline underline-offset-4"
            href="https://tscircuit.com"
            target="_blank"
          >
            tscircuit
          </Link>.
        </p>
        <p>
          Learn more in the <Link
            className="font-medium underline underline-offset-4"
            href="https://docs.tscircuit.com"
            target="_blank"
          >
            tscircuit docs
          </Link>.
        </p>
      </div>
    </motion.div>
  );
};
