import { NextApiRequest, NextApiResponse } from 'next';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { getSignatureMintPrivateKey } from '../../../../src/store/environment';
import { getChainById } from '../../../../src/store/supportedChains';
import handler from './free';

// Mock the external dependencies
jest.mock('../../../../src/store/environment');
jest.mock('../../../../src/store/supportedChains');
jest.mock('viem/accounts');

describe('/api/mint/signature/free handler', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  const getChainByIdMock = getChainById as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      query: {
        chainId: 'testChainId',
        wallet: 'testWallet',
      },
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    getChainByIdMock.mockReturnValue([{ id: baseSepolia.id }]);
    (getSignatureMintPrivateKey as jest.Mock).mockReturnValue('mockPrivateKey');

    const mockAccount = { signMessage: jest.fn().mockResolvedValue('mockSignature') };
    (privateKeyToAccount as jest.Mock).mockReturnValue(mockAccount);
  });

  it('returns 400 if chainId is missing', async () => {
    delete req.query?.chainId;
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'chainid is required' });
  });

  it('returns 400 if wallet is missing', async () => {
    delete req.query?.wallet;
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'wallet is required' });
  });

  it('returns 400 if signing key is missing', async () => {
    (getSignatureMintPrivateKey as jest.Mock).mockReturnValue('');
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'walletSigningKey is required' });
  });

  it('returns 200 with valid request', async () => {
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ signature: 'mockSignature' });
  });

  it('handles errors and returns 500', async () => {
    getChainByIdMock.mockImplementation(() => {
      throw new Error('Test error');
    });
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  // Add more tests as needed for different scenarios
});
