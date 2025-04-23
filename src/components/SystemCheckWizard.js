import React, { useEffect, useState } from 'react';
import styles from './SystemCheckWizard.module.css';

const CHECKS = [
  { key: 'webgl', label: 'GPU/WebGL Support', required: true },
  { key: 'browser', label: 'Browser & Platform', required: false },
  { key: 'ollama', label: 'Ollama Version', required: true },
  { key: 'disk', label: 'Disk Space', required: true },
];

const REQUIRED_MODEL_GB = 35;

function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { supported: false };
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
    return { supported: true, renderer };
  } catch {
    return { supported: false };
  }
}

const SystemCheckWizard = ({ onComplete }) => {
  const [ollamaVersion, setOllamaVersion] = useState('');
  const [ollamaValid, setOllamaValid] = useState(false);
  const [diskConfirmed, setDiskConfirmed] = useState(false);
  const [webglInfo, setWebglInfo] = useState({ supported: false, renderer: '' });
  const [browserInfo, setBrowserInfo] = useState('');

  useEffect(() => {
    setWebglInfo(getWebGLInfo());
    setBrowserInfo(`${navigator.platform}, ${navigator.userAgent}`);
  }, []);

  const handleOllamaInput = (e) => {
    const v = e.target.value.trim();
    setOllamaVersion(v);
    // Very basic validation: must look like a version >= 0.5.13
    setOllamaValid(/^0\.[5-9]\.[1-9][3-9]?|^[1-9]/.test(v));
  };

  const canContinue = webglInfo.supported && ollamaValid && diskConfirmed;

  return (
    <div className={styles.wizardOverlay}>
      <div className={styles.wizardModal}>
        <h2>System Check: Ready for Aether Canvas?</h2>
        <div className={styles.checklist}>
          <div className={styles.checkRow}>
            <span className={styles.checkIcon}>{webglInfo.supported ? '✔️' : '❌'}</span>
            <span className={styles.checkLabel}>GPU/WebGL Support</span>
            <span className={styles.checkMsg}>
              {webglInfo.supported
                ? `Detected: ${webglInfo.renderer}`
                : 'WebGL not supported (GPU required for best experience)'}
            </span>
          </div>
          <div className={styles.checkRow}>
            <span className={styles.checkIcon}>ℹ️</span>
            <span className={styles.checkLabel}>Browser & Platform</span>
            <span className={styles.checkMsg}>{browserInfo}</span>
          </div>
          <div className={styles.checkRow}>
            <span className={styles.checkIcon}>{ollamaValid ? '✔️' : '⚠️'}</span>
            <span className={styles.checkLabel}>Ollama Version</span>
            <span className={styles.checkMsg}>
              <input
                type="text"
                placeholder="Paste your Ollama version (e.g. 0.5.13)"
                value={ollamaVersion}
                onChange={handleOllamaInput}
                className={styles.ollamaInput}
                aria-label="Ollama version"
              />
              {!ollamaValid && (
                <span className={styles.warn} style={{ marginLeft: 8 }}>
                  Enter version ≥ 0.5.13
                </span>
              )}
            </span>
            <a
              href="https://github.com/ollama/ollama/releases"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docsLink}
            >
              Ollama Releases
            </a>
          </div>
          <div className={styles.checkRow}>
            <span className={styles.checkIcon}>{diskConfirmed ? '✔️' : '⚠️'}</span>
            <span className={styles.checkLabel}>Disk Space</span>
            <span className={styles.checkMsg}>
              <label>
                <input
                  type="checkbox"
                  checked={diskConfirmed}
                  onChange={e => setDiskConfirmed(e.target.checked)}
                  aria-label="Confirm at least 40GB free disk space"
                />
                I confirm I have at least 40GB free disk space
              </label>
            </span>
          </div>
        </div>
        <div className={styles.modelDiskReq}>
          <span>Default models require <b>{REQUIRED_MODEL_GB}GB</b> free disk space.</span>
        </div>
        <div className={styles.summaryMsg}>
          {canContinue ? (
            <span className={styles.pass}>Your system appears ready!</span>
          ) : (
            <span className={styles.fail}>Some requirements are not yet confirmed.</span>
          )}
        </div>
        <div className={styles.actions}>
          <button className={styles.continueBtn} onClick={onComplete} disabled={!canContinue}>
            Continue
          </button>
        </div>
        <div className={styles.modelDiskReq} style={{ marginTop: 12, fontSize: '0.98rem', color: '#b0b6c9' }}>
          <b>Note:</b> For privacy and security, browsers cannot detect your hardware or disk space directly. Please confirm requirements manually.
        </div>
      </div>
    </div>
  );
};

export default SystemCheckWizard;
