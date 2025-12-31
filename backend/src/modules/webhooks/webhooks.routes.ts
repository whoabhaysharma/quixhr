import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.send('webhooks module works');
});

export default router;
