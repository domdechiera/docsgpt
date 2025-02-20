'use client';

import { useChat, Message } from 'ai/react';
import { ArrowUp, SquarePen, Loader2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import { ModeToggle } from '@/components/mode-toggle';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 3,
  });
  const [thinkingTime, setThinkingTime] = useState<Record<string, number>>({});
  const thinkingStart = useRef<Record<string, number>>({});
  const [activeToolCalls, setActiveToolCalls] = useState<Record<string, boolean>>({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const hasScrollableContent = scrollHeight > clientHeight;
      const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(hasScrollableContent && isNotAtBottom);
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      // Check initially
      handleScroll();
      // Then add scroll listener
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Start timing when we see a new tool invocation
    if (lastMessage.role === 'assistant' && lastMessage.toolInvocations?.some(t => t.state === 'partial-call')) {
      if (!activeToolCalls[lastMessage.id]) {
        setActiveToolCalls(prev => ({ ...prev, [lastMessage.id]: true }));
        thinkingStart.current[lastMessage.id] = Date.now();
      }
    }
    
    // End timing when all tool invocations are complete and we have content
    if (lastMessage.content && activeToolCalls[lastMessage.id] && 
        (!lastMessage.toolInvocations?.length || lastMessage.toolInvocations.every(t => t.state !== 'partial-call'))) {
      const duration = (Date.now() - (thinkingStart.current[lastMessage.id] || Date.now())) / 1000;
      setThinkingTime(prev => ({ ...prev, [lastMessage.id]: duration }));
      setActiveToolCalls(prev => ({ ...prev, [lastMessage.id]: false }));
    }
  }, [messages, activeToolCalls]);

  // Also check when messages change
  useEffect(() => {
    handleScroll();
  }, [messages]);

  const renderMessage = (message: Message) => {
    if (message.content) {
      return (
        <>
          <ReactMarkdown className="[&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg [&>h4]:text-base
            [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold [&>h4]:font-semibold
            [&>*]:mt-0 [&>*]:mb-1
            [&>ul]:mt-0 [&>ul]:mb-1 [&>ul]:pl-4
            [&>ol]:mt-0 [&>ol]:mb-1 [&>ol]:pl-4
            [&_li]:mt-0 [&_li]:mb-0 [&_li]:font-light
            [&_li>p]:my-0
            [&>p]:mb-1 [&>p]:font-light
            [&_code]:font-mono [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded-sm
            text-base">
            {message.content}
          </ReactMarkdown>
          {thinkingTime[message.id] && (
            <div className="text-sm text-muted-foreground mt-1">
              Thought for {thinkingTime[message.id].toFixed(1)} seconds
            </div>
          )}
        </>
      );
    }

    if (activeToolCalls[message.id]) {
      return (
        <div className="flex items-center gap-2 italic font-light text-base">
          {message.toolInvocations?.some(t => (t as any).name === 'getInformation') ? (
            <>
              <span>Retrieving information</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <span>Thinking</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <header className="fixed top-0 left-0 right-0 h-16 bg-background backdrop-blur-sm z-50">
        <div className="flex justify-between items-center h-full px-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex items-center gap-3"
                >
                  <SquarePen className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-muted-foreground">DocsGPT</h2>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ModeToggle />
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-8 -mt-32">
          <h1 className="text-3xl font-medium text-foreground">
            What can I help with?
          </h1>
          <form onSubmit={handleSubmit} className="w-full max-w-3xl px-4">
            <div className="relative border border-input rounded-2xl bg-background dark:bg-[#303030]">
              <input
                className="w-full h-full bg-transparent border-0 focus:outline-none text-foreground px-3 pt-3 pb-16 placeholder:text-muted-foreground rounded-2xl"
                value={input}
                placeholder="Message DocsGPT"
                onChange={handleInputChange}
              />
              <Button 
                type="submit" 
                size="icon"
                className="rounded-full absolute bottom-2 right-2"
              >
                <ArrowUp className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
          <div className="fixed bottom-4 left-0 right-0 text-center">
            <span className="text-xs text-muted-foreground">DocsGPT can make mistakes. Check important info.</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen pt-16">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
            <div className="space-y-4 py-8 max-w-3xl mx-auto w-full px-4">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}>
                  <div className={`whitespace-pre-wrap ${
                    m.role === 'user' 
                      ? 'rounded-2xl px-4 py-2 bg-muted max-w-[80%]' 
                      : 'px-4 w-full'
                  } text-foreground`}>
                    {renderMessage(m)}
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} className="h-[50vh]" />
          </div>

          <div className="w-full bg-background relative">
            {showScrollButton && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full bg-background"
                  onClick={scrollToBottom}
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="sr-only">Scroll to bottom</span>
                </Button>
              </div>
            )}
            <div className="max-w-3xl mx-auto pb-2 pt-4 px-4">
              <form onSubmit={handleSubmit}>
                <div className="relative border border-input rounded-2xl bg-background dark:bg-[#303030]">
                  <input
                    className="w-full h-full bg-transparent border-0 focus:outline-none text-foreground px-3 pt-3 pb-16 placeholder:text-muted-foreground rounded-2xl"
                    value={input}
                    placeholder="Message DocsGPT"
                    onChange={handleInputChange}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    className="rounded-full absolute bottom-2 right-2"
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </div>
              </form>
            </div>
            <div className="text-center pb-2">
              <span className="text-xs text-muted-foreground">DocsGPT can make mistakes. Check important info.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}