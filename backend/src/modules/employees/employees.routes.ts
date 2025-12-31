import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.send('employees module works');
});

export default router;
