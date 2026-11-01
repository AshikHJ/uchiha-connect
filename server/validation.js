const badRequest = message => { throw Object.assign(new Error(message), { status: 400 }); };
const stringFields = ['full_name', 'username', 'photo_url', 'headline', 'bio', 'college', 'department', 'email', 'phone', 'template_id'];
const statuses = ['draft', 'published', 'unpublished'];
export function participantInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) badRequest('Participant must be an object');
  const data = {};
  for (const field of stringFields) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string' || body[field].length > (field === 'photo_url' ? 2000000 : 10000)) badRequest(`Invalid ${field}`);
    data[field] = body[field].trim();
  }
  if (data.username !== undefined && data.username !== '' && !/^[a-zA-Z0-9_-]{1,50}$/.test(data.username)) badRequest('Username must contain 1-50 letters, numbers, hyphens or underscores');
  if (body.publication_status !== undefined) {
    if (!statuses.includes(body.publication_status)) badRequest('Invalid publication status');
    data.publication_status = body.publication_status;
  }
  for (const field of ['social_links', 'projects', 'skills']) {
    if (body[field] === undefined) continue;
    if (!Array.isArray(body[field]) || body[field].length > 100) badRequest(`Invalid ${field}`);
    if (field === 'skills') {
      if (body[field].some(value => typeof value !== 'string')) badRequest('Skills must be text');
    } else {
      const required = field === 'social_links' ? ['id', 'platform', 'url', 'label'] : ['id', 'title', 'description', 'url'];
      if (body[field].some(value => !value || required.some(key => typeof value[key] !== 'string'))) badRequest(`Invalid ${field}`);
      if (body[field].some(value => value.url && !/^https?:\/\//i.test(value.url))) badRequest('Links must use http or https');
    }
    data[field] = body[field];
  }
  if (body.design_json !== undefined) {
    const design = body.design_json;
    if (design !== null) {
      if (!design?.canvas || !design.theme || !Array.isArray(design.elements) || design.elements.length > 500) badRequest('Invalid card design');
      for (const key of ['width', 'height']) if (!Number.isFinite(design.canvas[key]) || design.canvas[key] < 1 || design.canvas[key] > 4000) badRequest('Invalid canvas dimensions');
      const types = ['text', 'avatar', 'shape', 'badge', 'social_group', 'button', 'divider', 'project_card', 'qr_code'];
      const ids = new Set();
      for (const el of design.elements) {
        if (!el || typeof el.id !== 'string' || ids.has(el.id) || !types.includes(el.type) || !el.style || typeof el.style !== 'object') badRequest('Invalid design element');
        ids.add(el.id);
        if (['x', 'y', 'width', 'height'].some(key => !Number.isFinite(el[key])) || el.width < 1 || el.height < 1) badRequest('Invalid element geometry');
        if (el.content !== undefined && typeof el.content !== 'string') badRequest('Invalid element content');
        if (el.fieldBinding !== undefined && !stringFields.includes(el.fieldBinding)) badRequest('Invalid field binding');
      }
    }
    data.design_json = design;
  }
  return data;
}
