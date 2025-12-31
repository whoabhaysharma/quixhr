import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.send('invitations module works');
});

export default router;
