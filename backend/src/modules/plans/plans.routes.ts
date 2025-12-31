import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.send('plans module works');
});

export default router;
