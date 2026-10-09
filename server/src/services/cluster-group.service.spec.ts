import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JobName } from 'src/enum.js';
import { ClusterGroupService } from 'src/services/cluster-group.service.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { newUuid } from 'test/small.factory.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

describe(ClusterGroupService.name, () => {
  let sut: ClusterGroupService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(ClusterGroupService));
  });

  describe('regeneratePeople', () => {
    it('should reject a non-admin member of the group', async () => {
      const auth = AuthFactory.create({ isAdmin: false });
      const id = newUuid();
      mocks.access.clusterGroup.checkOwnerAccess.mockResolvedValue(new Set([id]));

      await expect(sut.regeneratePeople(auth, id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should reject an admin without access to the group', async () => {
      const auth = AuthFactory.create({ isAdmin: true });

      await expect(sut.regeneratePeople(auth, newUuid())).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should queue facial recognition for an admin member of the group', async () => {
      const auth = AuthFactory.create({ isAdmin: true });
      const id = newUuid();
      mocks.access.clusterGroup.checkOwnerAccess.mockResolvedValue(new Set([id]));

      await sut.regeneratePeople(auth, id);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.FacialRecognitionQueueAll,
        data: { clusterGroupId: id, force: true },
      });
    });
  });
});
