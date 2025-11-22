import { Footerdemo } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button"
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";

function Footer() {
  return (
    <div className="block">
      <Footerdemo />
    </div>
  );
}

export function AIInputWithSearchDemo() {
  return (
    <div className="space-y-8 min-w-[350px]">
      <div>
        <AIInputWithSearch 
          onSubmit={(value, withSearch) => {
            console.log('Message:', value);
            console.log('Search enabled:', withSearch);
          }}
          onFileSelect={(file) => {
            console.log('Selected file:', file);
          }}
        />
      </div>
    </div>
  );
}

export { Footer } 