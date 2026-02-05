import React from "react";
import { BLOCK_TYPES } from "@/constants";
import { ParagraphBlock } from "./ParagraphBlock";
import { HeadingBlock } from "./HeadingBlock";
import { CheckboxBlock } from "./CheckboxBlock";
import { BulletListBlock } from "./BulletListBlock";
import { NumberedListBlock } from "./NumberedListBlock";
import { CodeBlock } from "./CodeBlock";
import { TaskBlock } from "./TaskBlock";
import type { BlockComponentProps } from "@/types/editor";

interface BlockRendererProps extends BlockComponentProps {
  listNumber?: number;
}

export const BlockRenderer: React.FC<BlockRendererProps> = (props) => {
  const { block, listNumber } = props;

  switch (block.type) {
    case BLOCK_TYPES.PARAGRAPH:
      return <ParagraphBlock {...props} />;

    case BLOCK_TYPES.HEADING1:
    case BLOCK_TYPES.HEADING2:
    case BLOCK_TYPES.HEADING3:
      return <HeadingBlock {...props} />;

    case BLOCK_TYPES.CHECKBOX:
      return <CheckboxBlock {...props} />;

    case BLOCK_TYPES.BULLET_LIST:
      return <BulletListBlock {...props} />;

    case BLOCK_TYPES.NUMBERED_LIST:
      return <NumberedListBlock {...props} listNumber={listNumber} />;

    case BLOCK_TYPES.CODE:
      return <CodeBlock {...props} />;

    case BLOCK_TYPES.TASK:
      return <TaskBlock {...props} />;

    default:
      return <ParagraphBlock {...props} />;
  }
};
