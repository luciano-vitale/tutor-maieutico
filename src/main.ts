import './styles/main.css';
import { BrowserEnvironmentAdapter } from './adapters/BrowserEnvironmentAdapter';
import { LmStudioHttpAdapter } from './adapters/LmStudioHttpAdapter';
import { MaieuticSessionEngine } from './domain/MaieuticSessionEngine';
import { mountWorkspaceUI } from './ui/WorkspaceUI';

const appRoot = document.getElementById('app');

if (appRoot) {
  const inferenceAdapter = new LmStudioHttpAdapter();
  const environmentAdapter = new BrowserEnvironmentAdapter();
  const engine = new MaieuticSessionEngine(inferenceAdapter, environmentAdapter);
  void mountWorkspaceUI(appRoot, engine);
}
