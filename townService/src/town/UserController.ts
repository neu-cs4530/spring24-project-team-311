import assert from 'assert';
import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Header,
  Patch,
  Path,
  Post,
  Query,
  Response,
  Route,
  Tags,
} from 'tsoa';
import { User } from '../api/Model';
import InvalidParametersError from '../lib/InvalidParametersError';
import CoveyTownsStore from '../lib/TownsStore';

export class UserController extends Controller {}
