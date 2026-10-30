/** Digital Asset Links : prouve à Android que l'application (package + empreinte de signature) est liée à ce site,
 *  ce qui permet d'ouvrir l'app en plein écran, sans barre d'adresse (Trusted Web Activity). */
export function buildAssetLinks(pkg: string | undefined, fingerprints: string | undefined) {
  const name = (pkg || 'com.odthan.app').trim();
  const fps = (fingerprints || '').split(',').map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(name) || fps.length === 0) return [];
  return [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: name, sha256_cert_fingerprints: fps } }];
}
