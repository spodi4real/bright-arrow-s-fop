'use client';
import { useState } from 'react';
import { File, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { format } from 'date-fns';

type FileRow = {
  id: string;
  originalName: string;
  mimeType: string;
  category: string;
  createdAt: string;
  sizeBytes: number;
  uploadedBy: { displayName: string };
  mission: { name: string } | null;
};

export function FilesGrid({ files }: { files: FileRow[] }) {
  const [preview, setPreview] = useState<FileRow | null>(null);
  if (files.length === 0)
    return <Card className="p-12 text-center text-sm text-muted-foreground">No files in this folder.</Card>;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {files.map((f) => {
          const Icon = iconFor(f.mimeType);
          const isImg = f.mimeType.startsWith('image/');
          return (
            <button key={f.id} type="button" onClick={() => setPreview(f)} className="block text-left">
              <Card className="overflow-hidden hover:border-primary/40 transition-colors">
                <div className="aspect-square bg-muted relative flex items-center justify-center">
                  {isImg ? (
                    <img src={`/api/files/${f.id}`} alt={f.originalName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Icon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="p-2">
                  <div className="text-xs font-medium truncate">{f.originalName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{f.uploadedBy.displayName} · {format(new Date(f.createdAt), 'MMM d')}</div>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle className="text-sm truncate">{preview?.originalName}</DialogTitle></DialogHeader>
          {preview && (
            <div>
              {preview.mimeType.startsWith('image/') ? (
                <img src={`/api/files/${preview.id}`} alt={preview.originalName} className="max-h-[70vh] mx-auto" />
              ) : preview.mimeType.startsWith('video/') ? (
                <video controls className="max-h-[70vh] w-full"><source src={`/api/files/${preview.id}`} type={preview.mimeType} /></video>
              ) : (
                <div className="text-center py-12"><a href={`/api/files/${preview.id}`} target="_blank" rel="noreferrer" className="text-primary underline">Download {preview.originalName}</a></div>
              )}
              <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                <span>{preview.uploadedBy.displayName}</span>
                <span>{(preview.sizeBytes / 1024).toFixed(0)} KB</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function iconFor(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('video/')) return Video;
  if (mime.includes('pdf') || mime.includes('text')) return FileText;
  return File;
}
