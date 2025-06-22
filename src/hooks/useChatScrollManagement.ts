import { useRef, useEffect, useCallback, useState } from 'react';

interface UseChatScrollManagementProps {
  messages: any[];
  chatScrollPosition: number | null;
  setChatScrollPosition: (position: number | null) => void;
  pageName?: string;
}

export const useChatScrollManagement = ({
  messages,
  chatScrollPosition,
  setChatScrollPosition,
  pageName = 'Page'
}: UseChatScrollManagementProps) => {
  const [scrollRefReady, setScrollRefReady] = useState(false);
  const internalChatContentScrollRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const autoscrollFlagRef = useRef(false);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const previousMessagesLengthRef = useRef(messages.length);

  // Execute scroll to bottom helper
  const executeScrollToBottom = useCallback(() => {
    const sc = internalChatContentScrollRef.current;
    if (!sc || !scrollRefReady) {
      console.log("  [executeScrollToBottom] Aborted: Scroll container not ready.");
      return;
    }

    requestAnimationFrame(() => {
      if (internalChatContentScrollRef.current) {
        const currentSc = internalChatContentScrollRef.current;
        const targetScrollTop = Math.max(0, currentSc.scrollHeight - currentSc.clientHeight);
        currentSc.scrollTop = targetScrollTop;
        setChatScrollPosition(targetScrollTop);
        console.log(`  [executeScrollToBottom] First scroll attempt to: ${targetScrollTop}`);

        requestAnimationFrame(() => {
          if (internalChatContentScrollRef.current) {
            const currentScAfterSecondRaf = internalChatContentScrollRef.current;
            const targetScrollTopAfterSecondRaf = Math.max(0, currentScAfterSecondRaf.scrollHeight - currentScAfterSecondRaf.clientHeight);
            if (Math.abs(currentScAfterSecondRaf.scrollTop - targetScrollTopAfterSecondRaf) > 1) {
              currentScAfterSecondRaf.scrollTop = targetScrollTopAfterSecondRaf;
              setChatScrollPosition(targetScrollTopAfterSecondRaf);
              console.log(`  [executeScrollToBottom] Second scroll attempt to: ${targetScrollTopAfterSecondRaf}`);
            }
          }
        });
      }
    });
  }, [setChatScrollPosition, scrollRefReady]);

  // Scroll management effect
  useEffect(() => {
    console.log(`%c[${pageName}] EFFECT 1 TRIGGERED (Scroll/Restore/Autoscroll Intent)`, "color: blue; font-weight: bold;");
    const scrollContainer = internalChatContentScrollRef.current;

    if (!scrollRefReady || !scrollContainer) {
      console.warn(`  [${pageName}] EFFECT 1: Scroll container ref NOT READY or NULL.`);
      return;
    }

    const newMessagesAdded = messages.length > previousMessagesLengthRef.current;
    console.log(`  [${pageName}] EFFECT 1: newMessagesAdded: ${newMessagesAdded}`);

    if (newMessagesAdded) {
      console.log(`  [${pageName}] EFFECT 1: Setting autoscrollFlag TRUE.`);
      autoscrollFlagRef.current = true;
      executeScrollToBottom();
    } else {
      if (chatScrollPosition !== null && scrollContainer) {
        if (Math.abs(scrollContainer.scrollTop - chatScrollPosition) > 1.5) {
          console.log(`  [${pageName}] EFFECT 1: Restoring scrollTop to ${chatScrollPosition}.`);
          requestAnimationFrame(() => {
            if (internalChatContentScrollRef.current) {
              internalChatContentScrollRef.current.scrollTop = chatScrollPosition;
            }
          });
        }
      }
    }

    previousMessagesLengthRef.current = messages.length;
  }, [messages, chatScrollPosition, scrollRefReady, executeScrollToBottom, pageName]);

  // Resize observer effect
  useEffect(() => {
    const scrollContainer = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollContainer) return;

    const observer = new ResizeObserver(() => {
      if (autoscrollFlagRef.current && internalChatContentScrollRef.current) {
        executeScrollToBottom();
      }
    });
    observer.observe(scrollContainer);
    resizeObserverRef.current = observer;

    return () => {
      if (observer) {
        observer.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [scrollRefReady, executeScrollToBottom]);

  // Manual scroll handling
  useEffect(() => {
    const scrollElement = internalChatContentScrollRef.current;
    if (!scrollRefReady || !scrollElement) return;

    let scrollTimeout: number;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        if (internalChatContentScrollRef.current) {
          const sc = internalChatContentScrollRef.current;
          const currentScrollTop = sc.scrollTop;
          setChatScrollPosition(currentScrollTop);

          const isAtBottom = sc.scrollHeight - currentScrollTop - sc.clientHeight < 5;
          if (autoscrollFlagRef.current !== isAtBottom) {
            console.log(`  [${pageName}] autoscrollFlagRef changed from ${autoscrollFlagRef.current} to ${isAtBottom}`);
            autoscrollFlagRef.current = isAtBottom;
          }
        }
      }, 150);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRefReady, setChatScrollPosition, pageName]);

  // Chat content scroll ref callback
  const chatContentScrollRef = useCallback((node: HTMLDivElement | null) => {
    internalChatContentScrollRef.current = node;
    setScrollRefReady(!!node);
    if (node) {
      console.log(`[${pageName}] chatContentScrollRef CALLBACK FIRED with node.`);
    }
  }, [pageName]);

  // Messages content ref callback for mutation observer
  const messagesContentRef = useCallback((node: HTMLDivElement | null) => {
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
      mutationObserverRef.current = null;
    }

    if (node && scrollRefReady) {
      const observer = new MutationObserver((mutationsList) => {
        if (autoscrollFlagRef.current && mutationsList.length > 0) {
          console.log(`  [${pageName}] Mutation Observer: Scrolling.`);
          executeScrollToBottom();
        }
      });
      
      observer.observe(node, { childList: true, subtree: true, characterData: true });
      mutationObserverRef.current = observer;
    }
  }, [scrollRefReady, executeScrollToBottom, pageName]);

  return {
    chatContentScrollRef,
    messagesContentRef,
    scrollRefReady
  };
}; 