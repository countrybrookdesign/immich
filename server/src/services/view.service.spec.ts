import { mapAsset } from 'src/dtos/asset-response.dto.js';
import { ViewService } from 'src/services/view.service.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { PartnerFactory } from 'test/factories/partner.factory.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { getForAsset, getForPartner } from 'test/mappers.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

describe(ViewService.name, () => {
  let sut: ViewService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ViewService));
    mocks.partner.getAll.mockResolvedValue([]);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getUniqueOriginalPaths', () => {
    it('should return unique original paths', async () => {
      const mockPaths = ['path1', 'path2', 'path3'];
      mocks.view.getUniqueOriginalPaths.mockResolvedValue(mockPaths);

      const result = await sut.getUniqueOriginalPaths(authStub.admin);

      expect(result).toEqual(mockPaths);
      expect(mocks.view.getUniqueOriginalPaths).toHaveBeenCalledWith([authStub.admin.user.id]);
    });

    it('should include partners with "Show in timeline" enabled', async () => {
      const auth = AuthFactory.create();
      const partner = PartnerFactory.create({ sharedWithId: auth.user.id });
      const hiddenPartner = PartnerFactory.create({ sharedWithId: auth.user.id, inTimeline: false });
      mocks.partner.getAll.mockResolvedValue([getForPartner(partner), getForPartner(hiddenPartner)]);
      mocks.view.getUniqueOriginalPaths.mockResolvedValue([]);

      await sut.getUniqueOriginalPaths(auth);

      expect(mocks.view.getUniqueOriginalPaths).toHaveBeenCalledWith([auth.user.id, partner.sharedById]);
    });
  });

  describe('getAssetsByOriginalPath', () => {
    it('should return assets by original path', async () => {
      const path = '/asset';

      const asset1 = AssetFactory.create({ originalPath: '/asset/path1' });
      const asset2 = AssetFactory.create({ originalPath: '/asset/path2' });

      const mockAssets = [asset1, asset2];

      const mockAssetReponseDto = mockAssets.map((asset) => mapAsset(getForAsset(asset), { auth: authStub.admin }));

      mocks.view.getAssetsByOriginalPath.mockResolvedValue(mockAssets as any);

      const result = await sut.getAssetsByOriginalPath(authStub.admin, path);
      expect(result).toEqual(mockAssetReponseDto);
      await expect(mocks.view.getAssetsByOriginalPath([authStub.admin.user.id], path)).resolves.toEqual(mockAssets);
    });

    it('should include partners with "Show in timeline" enabled', async () => {
      const auth = AuthFactory.create();
      const partner = PartnerFactory.create({ sharedWithId: auth.user.id });
      const hiddenPartner = PartnerFactory.create({ sharedWithId: auth.user.id, inTimeline: false });
      mocks.partner.getAll.mockResolvedValue([getForPartner(partner), getForPartner(hiddenPartner)]);
      mocks.view.getAssetsByOriginalPath.mockResolvedValue([]);

      await sut.getAssetsByOriginalPath(auth, '/asset');

      expect(mocks.view.getAssetsByOriginalPath).toHaveBeenCalledWith([auth.user.id, partner.sharedById], '/asset');
    });
  });
});
