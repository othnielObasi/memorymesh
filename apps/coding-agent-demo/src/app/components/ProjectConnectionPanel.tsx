import { Folder, Github, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';

export type ProjectSource = 'sample' | 'local_path' | 'github_url' | 'zip_upload';

export type ConnectedProject = {
  source: ProjectSource;
  repositoryName: string;
  workspacePath?: string;
  githubUrl?: string;
};

interface Props {
  source: ProjectSource;
  onSourceChange: (source: ProjectSource) => void;
  localPath: string;
  onLocalPathChange: (value: string) => void;
  githubUrl: string;
  onGithubUrlChange: (value: string) => void;
  connectedProject: ConnectedProject | null;
  uploadBusy: boolean;
  uploadError: string | null;
  onUseSample: () => void;
  onConnectLocalPath: () => void;
  onConnectGithub: () => void;
  onUploadZip: (file: File) => void;
}

const OPTIONS = [
  { id: 'sample' as const, label: 'Sample project', icon: Folder },
  { id: 'local_path' as const, label: 'Local folder', icon: Folder },
  { id: 'github_url' as const, label: 'GitHub repo', icon: Github },
  { id: 'zip_upload' as const, label: 'Upload zip', icon: Upload },
];

export function ProjectConnectionPanel({
  source,
  onSourceChange,
  localPath,
  onLocalPathChange,
  githubUrl,
  onGithubUrlChange,
  connectedProject,
  uploadBusy,
  uploadError,
  onUseSample,
  onConnectLocalPath,
  onConnectGithub,
  onUploadZip,
}: Props) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-mono-ui uppercase tracking-widest text-primary">Project</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Connect the codebase</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The coding workflow needs a project. Use the sample, point to a local folder, clone GitHub, or upload a zip.
          </p>
        </div>
        {connectedProject && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {connectedProject.repositoryName}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = source === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSourceChange(option.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                active ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-background/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {source === 'sample' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Use the bundled dashboard service to prove memory, tests, recovery, and receipts.</p>
            <Button type="button" onClick={onUseSample}>Use sample project</Button>
          </div>
        )}

        {source === 'local_path' && (
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div>
              <Label htmlFor="local-project-path" className="mb-2 block text-xs text-muted-foreground">Folder path on this machine</Label>
              <input
                id="local-project-path"
                value={localPath}
                onChange={(event) => onLocalPathChange(event.target.value)}
                placeholder="C:\\path\\to\\your\\repo"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <Button type="button" className="self-end" onClick={onConnectLocalPath} disabled={!localPath.trim()}>
              Connect folder
            </Button>
          </div>
        )}

        {source === 'github_url' && (
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div>
              <Label htmlFor="github-project-url" className="mb-2 block text-xs text-muted-foreground">HTTPS GitHub repository URL</Label>
              <input
                id="github-project-url"
                value={githubUrl}
                onChange={(event) => onGithubUrlChange(event.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <Button type="button" className="self-end" onClick={onConnectGithub} disabled={!githubUrl.trim()}>
              Connect GitHub
            </Button>
          </div>
        )}

        {source === 'zip_upload' && (
          <div>
            <Label htmlFor="project-zip" className="mb-2 block text-xs text-muted-foreground">Project zip archive</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/30 px-4 py-8 text-center transition hover:border-primary/40">
              {uploadBusy ? <Loader2 className="mb-3 h-5 w-5 animate-spin text-primary" /> : <Upload className="mb-3 h-5 w-5 text-primary" />}
              <span className="text-sm font-medium text-foreground">{uploadBusy ? 'Uploading...' : 'Choose zip file'}</span>
              <span className="mt-1 text-xs text-muted-foreground">Extracted locally, then used as the coding workflow project.</span>
              <input
                id="project-zip"
                type="file"
                accept=".zip,application/zip"
                disabled={uploadBusy}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUploadZip(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        )}
      </div>

      {uploadError && <p className="mt-3 text-sm text-destructive">{uploadError}</p>}
      {connectedProject && (
        <p className="mt-3 truncate text-xs text-muted-foreground">
          Connected: {connectedProject.githubUrl || connectedProject.workspacePath || connectedProject.repositoryName}
        </p>
      )}
    </section>
  );
}
