import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { IndexRoute } from './IndexRoute.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
