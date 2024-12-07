import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { notificationConverter } from '../../../converters/notification';
import { db } from '../../../firebase/init';
