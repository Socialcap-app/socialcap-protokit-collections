
export interface CollectionNotification {
  action: 'add' | 'update' | 'remove',
  collection: 'Communities' | 'Persons' | 'Members' | 'Plans' | 'Claims' | 'Tasks' ;
  uid: string;
  contentHash: string;
  contentSize: number;
  updatedBy: string;
}
