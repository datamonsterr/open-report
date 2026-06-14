import { describe, it, expect, vi } from 'vitest';
import { api } from '~/utils/api';

describe('api', () => {
  it('should call listProjects', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    
    const projects = await api.listProjects();
    expect(projects).toEqual([]);
    expect(fetch).toHaveBeenCalledWith('/api/projects', expect.anything());
  });
});
